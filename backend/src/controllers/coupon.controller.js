import { Coupon, CouponUsage, Product,sequelize } from "../models/index.model.js";
import { Op } from "sequelize";

// api
export const createCoupon = async (req, res) => {
  try {
    const {
      code,
      name,
      description,
      type,
      value,
      maxDiscountAmount,
      minimumAmount,
      usageLimit,
      usageLimitPerUser = 1,
      startDate,
      endDate,
      isActive = true,
      isGlobal = true,
      applicableProducts = [],
    } = req.body;

    // Validate input
    if (!code || !name || !type || !value) {
      return res.status(400).json({
        success: false,
        message: "Code, name, type, and value are required",
      });
    }

    // Validate percentage coupon
    if (type === "percentage" && value > 100) {
      return res.status(400).json({
        success: false,
        message: "Percentage discount cannot exceed 100%",
      });
    }

    // Validate dates
    if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({
        success: false,
        message: "End date must be after start date",
      });
    }

    // Create coupon
    const coupon = await Coupon.create({
      code: code.toUpperCase(),
      name,
      description,
      type,
      value,
      maxDiscountAmount,
      minimumAmount,
      usageLimit,
      usageLimitPerUser,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      isActive,
      isGlobal,
      applicableProducts: isGlobal ? [] : applicableProducts,
    });

    return res.status(201).json({
      success: true,
      data: coupon,
      message: "Coupon created successfully",
    });
  } catch (error) {
    console.error("Create coupon error:", error);

    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        success: false,
        message: "Coupon code already exists",
      });
    }

    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors.map((e) => e.message),
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create coupon",
    });
  }
};

export const updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      code,
      name,
      description,
      type,
      value,
      maxDiscountAmount,
      minimumAmount,
      usageLimit,
      usageLimitPerUser,
      startDate,
      endDate,
      isActive,
      isGlobal,
      applicableProducts,
    } = req.body;

    // Check if coupon exists
    const existingCoupon = await Coupon.findByPk(id);
    if (!existingCoupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    // Validate percentage coupon if type or value is being updated
    const updatedType = type !== undefined ? type : existingCoupon.type;
    const updatedValue = value !== undefined ? value : existingCoupon.value;

    if (updatedType === "percentage" && updatedValue > 100) {
      return res.status(400).json({
        success: false,
        message: "Percentage discount cannot exceed 100%",
      });
    }

    // Validate dates if they are being updated
    const updatedStartDate =
      startDate !== undefined ? startDate : existingCoupon.startDate;
    const updatedEndDate =
      endDate !== undefined ? endDate : existingCoupon.endDate;

    if (
      updatedStartDate &&
      updatedEndDate &&
      new Date(updatedStartDate) >= new Date(updatedEndDate)
    ) {
      return res.status(400).json({
        success: false,
        message: "End date must be after start date",
      });
    }

    // Prepare update data
    const updateData = {};

    if (code !== undefined) updateData.code = code.toUpperCase();
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (type !== undefined) updateData.type = type;
    if (value !== undefined) updateData.value = value;
    if (maxDiscountAmount !== undefined)
      updateData.maxDiscountAmount = maxDiscountAmount;
    if (minimumAmount !== undefined) updateData.minimumAmount = minimumAmount;
    if (usageLimit !== undefined) updateData.usageLimit = usageLimit;
    if (usageLimitPerUser !== undefined)
      updateData.usageLimitPerUser = usageLimitPerUser;
    if (startDate !== undefined)
      updateData.startDate = startDate ? new Date(startDate) : null;
    if (endDate !== undefined)
      updateData.endDate = endDate ? new Date(endDate) : null;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (isGlobal !== undefined) {
      updateData.isGlobal = isGlobal;
      // If changing to global, clear applicable products
      if (isGlobal) {
        updateData.applicableProducts = [];
      }
    }
    if (applicableProducts !== undefined && !updateData.isGlobal) {
      updateData.applicableProducts = applicableProducts;
    }

    // Update coupon
    await existingCoupon.update(updateData);

    // Fetch updated coupon to return
    const updatedCoupon = await Coupon.findByPk(id);

    return res.status(200).json({
      success: true,
      data: updatedCoupon,
      message: "Coupon updated successfully",
    });
  } catch (error) {
    console.error("Update coupon error:", error);

    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        success: false,
        message: "Coupon code already exists",
      });
    }

    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors.map((e) => e.message),
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update coupon",
    });
  }
};



export const removeCoupon = async (req, res) => {
  const { couponId } = req.params;

  try {
    const coupon = await Coupon.findByPk(couponId);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    await coupon.destroy();

    return res.status(200).json({
      success: true,
      message: "Coupon removed successfully",
    });
  } catch (error) {
    console.error("Remove coupon error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to remove coupon",
    });
  }
};

export const restoreCoupon = async (req, res) => {
  const { couponId } = req.params;

  try {
    const coupon = await Coupon.findOne({
      where: { id: couponId },
      paranoid: false,
    });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    if (coupon.deletedAt === null) {
      return res.status(400).json({
        success: false,
        message: "Coupon is not deleted",
      });
    }

    await coupon.restore();

    return res.status(200).json({
      success: true,
      message: "Coupon restored successfully",
      data: coupon,
    });
  } catch (error) {
    console.error("Restore coupon error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to restore coupon",
    });
  }
};

export const getUserCoupons = async (req, res) => {
  const { userId } = req.params;

  try {
    const now = new Date();

    // Get all active coupons that user hasn't exceeded usage limit
    const coupons = await Coupon.findAll({
      where: {
        isActive: true,
        [Op.and]: [
          {
            [Op.or]: [{ startDate: null }, { startDate: { [Op.lte]: now } }],
          },
          {
            [Op.or]: [{ endDate: null }, { endDate: { [Op.gte]: now } }],
          },
          {
            [Op.or]: [
              { usageLimit: null },
              { usedCount: { [Op.lt]: { [Op.col]: "usageLimit" } } },
            ],
          },
        ],
      },
      attributes: [
        "id",
        "code",
        "name",
        "description",
        "type",
        "value",
        "minimumAmount",
        "maxDiscountAmount",
        "endDate",
        "usageLimitPerUser",
      ],
      order: [["createdAt", "DESC"]],
    });

    const couponIdsWithLimits = coupons
      .filter((c) => c.usageLimitPerUser)
      .map((c) => c.id);

    const usageCounts = await CouponUsage.findAll({
      where: {
        userId,
        couponId: couponIdsWithLimits,
      },
      attributes: ["couponId", [fn("COUNT", col("id")), "count"]],
      group: ["couponId"],
    });

    const usageCountMap = {};
    usageCounts.forEach((row) => {
      usageCountMap[row.couponId] = parseInt(row.get("count"), 10);
    });

    const availableCoupons = coupons.filter((coupon) => {
      if (coupon.usageLimitPerUser) {
        const userUsageCount = usageCountMap[coupon.id] || 0;
        return userUsageCount < coupon.usageLimitPerUser;
      }
      return true;
    });

    return res.status(200).json({
      success: true,
      coupons: availableCoupons,
      count: availableCoupons.length,
    });
  } catch (error) {
    console.error("Get user coupons error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get user coupons",
    });
  }
};

export const getCouponUsage = async (req, res) => {
  const { couponId } = req.params;
  const { page = 1, limit = 50 } = req.query;

  try {
    const offset = (page - 1) * limit;

    const { count, rows } = await CouponUsage.findAndCountAll({
      where: { couponId },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "email"],
        },
        {
          model: Product,
          as: "product",
          attributes: ["id", "name", "price"],
        },
      ],
      order: [["usedAt", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    return res.status(200).json({
      success: true,
      data: {
        usage: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get coupon usage error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get coupon usage",
    });
  }
};

export const getAllCoupons = async (req, res) => {
  const { page = 1, limit = 50 } = req.query;

  try {
    const offset = (page - 1) * limit;

    const { count, rows } = await Coupon.findAndCountAll({
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    return res.status(200).json({
      success: true,
      data: {
        coupons: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get all coupons error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get coupons",
    });
  }
};

// ************************************************************************************************

// export async function applyCouponToOrder(
//   couponCodes,
//   userId,
//   orderProducts,
//   transaction = null
// ) {
//   let totalDiscountAmount = 0;
//   let updatedProducts = [...orderProducts];
//   const appliedCoupons = [];
//   const failedCoupons = [];

//   // Ensure couponCodes is always an array
//   const codesArray = Array.isArray(couponCodes) ? couponCodes : [couponCodes];
//   console.log(codesArray, "couponCodes");

//   async function applySingleCoupon(
//     couponId,
//     userId,
//     orderProducts,
//     transaction
//   ) {
//     try {
//       // Step 1: Validate coupon existence and basic properties
//       const coupon = await Coupon.findByPk(couponId, { transaction });
//       if (!coupon) {
//         return {
//           success: false,
//           message: "Coupon not found",
//           discountAmount: 0,
//           updatedProducts: orderProducts,
//         };
//       }

//       // Step 2: Validate coupon status and dates
//       const now = new Date();
//       if (!coupon.isActive) {
//         return {
//           success: false,
//           message: "Coupon is not active",
//           discountAmount: 0,
//           updatedProducts: orderProducts,
//         };
//       }

//       if (coupon.startDate && new Date(coupon.startDate) > now) {
//         return {
//           success: false,
//           message: "Coupon is not yet valid",
//           discountAmount: 0,
//           updatedProducts: orderProducts,
//         };
//       }

//       if (coupon.endDate && new Date(coupon.endDate) < now) {
//         return {
//           success: false,
//           message: "Coupon has expired",
//           discountAmount: 0,
//           updatedProducts: orderProducts,
//         };
//       }

//       // Additional validation: Check if coupon is soft deleted
//       if (coupon.deletedAt) {
//         return {
//           success: false,
//           message: "Coupon is no longer available",
//           discountAmount: 0,
//           updatedProducts: orderProducts,
//         };
//       }

//       // Step 3: Check overall usage limit
//       if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
//         return {
//           success: false,
//           message: "Coupon usage limit exceeded",
//           discountAmount: 0,
//           updatedProducts: orderProducts,
//         };
//       }

//       // Step 4: Get existing coupon usage for this user
//       const existingUsages = await CouponUsage.findAll({
//         where: { userId, couponId },
//         transaction,
//       });

//       const userUsageCount = existingUsages.length;
//       const usedProductIds = existingUsages.map((usage) => usage.productId);

//       if (
//         coupon.usageLimitPerUser &&
//         userUsageCount >= coupon.usageLimitPerUser
//       ) {
//         return {
//           success: false,
//           message: "User coupon usage limit exceeded",
//           discountAmount: 0,
//           updatedProducts: orderProducts,
//         };
//       }

//       // Step 5: Check if coupon is applicable to products (if not global)
//       let eligibleProducts = [...orderProducts];

//       if (
//         !coupon.isGlobal &&
//         coupon.applicableProducts &&
//         coupon.applicableProducts.length > 0
//       ) {
//         eligibleProducts = orderProducts.filter((product) =>
//           coupon.applicableProducts.includes(product.productId)
//         );

//         if (eligibleProducts.length === 0) {
//           return {
//             success: false,
//             message: "Coupon is not applicable to any products in the order",
//             discountAmount: 0,
//             updatedProducts: orderProducts,
//           };
//         }
//       }

//       // Step 6: Filter out products already used with this coupon by this user
//       const availableProducts = eligibleProducts.filter(
//         (product) => !usedProductIds.includes(product.productId)
//       );

//       if (availableProducts.length === 0) {
//         return {
//           success: false,
//           message:
//             "You have already used this coupon on all applicable products",
//           discountAmount: 0,
//           updatedProducts: orderProducts,
//         };
//       }

//       // Step 7: Calculate remaining usage for this user
//       const remainingUsage = coupon.usageLimitPerUser
//         ? coupon.usageLimitPerUser - userUsageCount
//         : Number.MAX_SAFE_INTEGER;

//       // Step 8: Check minimum amount requirement
//       const totalOrderAmount = eligibleProducts.reduce((sum, product) => {
//         const unitPrice = product.variant
//           ? parseFloat(product.variant.price)
//           : parseFloat(product.product.price);
//         return sum + unitPrice * product.quantity;
//       }, 0);

//       console.log(totalOrderAmount, "total ordered amount");
//       if (coupon.minimumAmount && totalOrderAmount < coupon.minimumAmount) {
//         return {
//           success: false,
//           message: `Minimum order amount of ${coupon.minimumAmount} required`,
//           discountAmount: 0,
//           updatedProducts: orderProducts,
//         };
//       }

//       // Step 9: Sort available products by price (highest first) for optimal discount application
//       const sortedProducts = availableProducts
//         .map((product) => ({
//           ...product,
//           unitPrice: product.variant
//             ? parseFloat(product.variant.price)
//             : parseFloat(product.product.price),
//           originalIndex: orderProducts.indexOf(product),
//         }))
//         .sort((a, b) => b.unitPrice - a.unitPrice);

//       // Step 10: Apply discount to products (one product per usage)
//       let totalDiscountAmount = 0;
//       let usageCount = 0;
//       const maxUsage = Math.min(remainingUsage, sortedProducts.length);
//       const updatedProducts = [...orderProducts];
//       const couponUsages = [];

//       for (let i = 0; i < maxUsage && i < sortedProducts.length; i++) {
//         const product = sortedProducts[i];
//         let discountAmount = 0;

//         // Calculate discount based on coupon type
//         if (coupon.type === "percentage") {
//           // For percentage discount, apply to the total amount of this product (unitPrice * quantity)
//           const productTotal = product.unitPrice * product.quantity;
//           discountAmount = (productTotal * coupon.value) / 100;
//         } else if (coupon.type === "fixed") {
//           // For fixed discount, apply to individual units up to the quantity
//           const maxFixedDiscount = Math.min(
//             coupon.value,
//             product.unitPrice * product.quantity
//           );
//           discountAmount = maxFixedDiscount;
//         }

//         // Apply maximum discount amount limit
//         if (coupon.maxDiscountAmount) {
//           discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
//         }

//         // Ensure discount doesn't exceed product total price
//         const productTotal = product.unitPrice * product.quantity;
//         discountAmount = Math.min(discountAmount, productTotal);

//         // Round to 2 decimal places to avoid floating point issues
//         discountAmount = Math.round(discountAmount * 100) / 100;

//         if (discountAmount > 0) {
//           totalDiscountAmount += discountAmount;
//           usageCount++;

//           // Update the original product in the order
//           const originalProduct = updatedProducts[product.originalIndex];
//           if (!originalProduct.appliedCoupons) {
//             originalProduct.appliedCoupons = [];
//           }

//           originalProduct.appliedCoupons.push({
//             couponId: couponId,
//             discountAmount: discountAmount,
//             appliedToPrice: productTotal,
//           });

//           // Create coupon usage record (ONE per product, not per quantity)
//           couponUsages.push({
//             userId: userId,
//             couponId: couponId,
//             productId: product.productId,
//             discountAmount: discountAmount,
//             originalPrice: productTotal,
//             quantity: product.quantity, // Track how many items this discount applies to
//             usedAt: now,
//           });
//         }
//       }

//       // Step 11: Save coupon usage records
//       if (couponUsages.length > 0) {
//         try {
//           await CouponUsage.bulkCreate(couponUsages, {
//             transaction,
//             ignoreDuplicates: false, // We want to know if there are duplicates
//           });
//         } catch (error) {
//           if (error.name === "SequelizeUniqueConstraintError") {
//             return {
//               success: false,
//               message:
//                 "This coupon has already been used on some of these products",
//               discountAmount: 0,
//               updatedProducts: orderProducts,
//             };
//           }
//           throw error; // Re-throw other errors
//         }
//       }

//       // Step 12: Update coupon used count
//       await coupon.update(
//         { usedCount: coupon.usedCount + usageCount },
//         { transaction }
//       );

//       // Step 13: Calculate final discount per product for order summary
//       updatedProducts.forEach((product) => {
//         if (product.appliedCoupons && product.appliedCoupons.length > 0) {
//           product.totalCouponDiscount = product.appliedCoupons.reduce(
//             (sum, coupon) => sum + coupon.discountAmount,
//             0
//           );
//         } else {
//           product.totalCouponDiscount = 0;
//         }
//       });

//       return {
//         success: true,
//         message: "Coupon applied successfully",
//         discountAmount: Math.round(totalDiscountAmount * 100) / 100,
//         usageCount: usageCount,
//         updatedProducts: updatedProducts,
//         couponDetails: {
//           code: coupon.code,
//           name: coupon.name,
//           type: coupon.type,
//           value: coupon.value,
//         },
//       };
//     } catch (error) {
//       console.error("Error applying coupon to order:", error);
//       return {
//         success: false,
//         message: "Error applying coupon",
//         discountAmount: 0,
//         updatedProducts: orderProducts,
//         error: error.message,
//       };
//     }
//   }

//   // Get coupons by codes
//   const coupons = await Coupon.findAll({
//     where: {
//       code: codesArray,
//     },
//     attributes: ["id", "code"],
//     transaction,
//   });

//   if (coupons.length === 0) {
//     return {
//       success: false,
//       totalDiscountAmount: 0,
//       updatedProducts: orderProducts,
//       appliedCoupons: [],
//       failedCoupons: codesArray.map((code) => ({
//         code: code,
//         reason: "Coupon not found",
//       })),
//     };
//   }

//   // Apply each coupon
//   for (const coupon of coupons) {
//     const result = await applySingleCoupon(
//       coupon.id,
//       userId,
//       updatedProducts,
//       transaction
//     );

//     if (result.success) {
//       totalDiscountAmount += result.discountAmount;
//       updatedProducts = result.updatedProducts;
//       appliedCoupons.push({
//         couponId: coupon.id,
//         couponCode: coupon.code,
//         discountAmount: result.discountAmount,
//         usageCount: result.usageCount,
//         couponDetails: result.couponDetails,
//       });
//     } else {
//       failedCoupons.push({
//         couponId: coupon.id,
//         couponCode: coupon.code,
//         reason: result.message,
//       });
//     }
//   }

//   return {
//     success: appliedCoupons.length > 0,
//     totalDiscountAmount: Math.round(totalDiscountAmount * 100) / 100,
//     updatedProducts: updatedProducts,
//     appliedCoupons: appliedCoupons,
//     failedCoupons: failedCoupons,
//   };
// }


// export async function applyCouponToOrder(
//   couponCodes,
//   userId,
//   orderProducts,
//   transaction = null
// ) {
//   let totalDiscountAmount = 0;
//   let updatedProducts = [...orderProducts];
//   const appliedCoupons = [];
//   const failedCoupons = [];

//   // Ensure couponCodes is always an array
// const codesArray = Array.isArray(couponCodes) ? couponCodes : [couponCodes];
  
//   console.log("Processing coupon codes:", codesArray);
//   console.log("Order products:", orderProducts);

//   /**
//    * Apply a single coupon to eligible products
//    * This function implements proper e-commerce coupon logic
//    */
//   async function applySingleCoupon(coupon, userId, orderProducts, transaction) {
//     try {
//       console.log(`Processing coupon: ${coupon.code}`);

//       // Step 1: Validate coupon status and dates
//       const now = new Date();
      
//       if (!coupon.isActive) {
//         return {
//           success: false,
//           message: "Coupon is not active",
//           discountAmount: 0,
//           updatedProducts: orderProducts,
//         };
//       }

//       if (coupon.startDate && new Date(coupon.startDate) > now) {
//         return {
//           success: false,
//           message: "Coupon is not yet valid",
//           discountAmount: 0,
//           updatedProducts: orderProducts,
//         };
//       }

//       if (coupon.endDate && new Date(coupon.endDate) < now) {
//         return {
//           success: false,
//           message: "Coupon has expired",
//           discountAmount: 0,
//           updatedProducts: orderProducts,
//         };
//       }

//       // Step 2: Check overall usage limit
//       if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
//         return {
//           success: false,
//           message: "Coupon usage limit exceeded",
//           discountAmount: 0,
//           updatedProducts: orderProducts,
//         };
//       }

//       // Step 3: Get existing coupon usage for this user
//       const existingUsages = await CouponUsage.findAll({
//         where: { 
//           userId, 
//           couponId: coupon.id 
//         },
//         transaction,
//       });

//       const userUsageCount = existingUsages.length;
      
//       // Check per-user usage limit
//       if (coupon.usageLimitPerUser && userUsageCount >= coupon.usageLimitPerUser) {
//         return {
//           success: false,
//           message: "You have reached the usage limit for this coupon",
//           discountAmount: 0,
//           updatedProducts: orderProducts,
//         };
//       }

//       // Get products already used with this coupon by this user
//       const usedProductIds = existingUsages.map((usage) => usage.productId);

//       // Step 4: Determine eligible products
//       let eligibleProducts = [...orderProducts];

//       // Filter by applicable products if not global
//       if (!coupon.isGlobal && coupon.applicableProducts && coupon.applicableProducts.length > 0) {
//         eligibleProducts = orderProducts.filter((product) =>
//           coupon.applicableProducts.includes(product.productId)
//         );

//         if (eligibleProducts.length === 0) {
//           return {
//             success: false,
//             message: "Coupon is not applicable to any products in your order",
//             discountAmount: 0,
//             updatedProducts: orderProducts,
//           };
//         }
//       }

//       // Filter out products already used with this coupon by this user
//       const availableProducts = eligibleProducts.filter(
//         (product) => !usedProductIds.includes(product.productId)
//       );

//       if (availableProducts.length === 0) {
//         return {
//           success: false,
//           message: "You have already used this coupon on all applicable products",
//           discountAmount: 0,
//           updatedProducts: orderProducts,
//         };
//       }

//       // Step 5: Calculate total order amount for minimum amount validation
//       // CRITICAL FIX: Calculate total for ALL eligible products, not just available ones
//         const totalEligibleAmount = eligibleProducts.reduce((sum, product) => {
//         const unitPrice = product.variant
//           ? parseFloat(product.variant.price)
//           : parseFloat(product.product.price);
//         return sum + (unitPrice * product.quantity);
//       }, 0);

//       console.log(`Total eligible amount: ${totalEligibleAmount}, Minimum required: ${coupon.minimumAmount}`);

//       // Check minimum amount requirement on TOTAL eligible order amount
//       if (coupon.minimumAmount && totalEligibleAmount < coupon.minimumAmount) {
//         return {
//           success: false,
//           message: `Minimum order amount of $${coupon.minimumAmount} required for eligible products. Current eligible amount: $${totalEligibleAmount.toFixed(2)}`,
//           discountAmount: 0,
//           updatedProducts: orderProducts,
//         };
//       }

//         const qualifiedProducts = availableProducts.filter(product => {
//         const productTotal = (product.variant ? parseFloat(product.variant.price) : 
//                              parseFloat(product.product.price)) * product.quantity;
//         return productTotal >= coupon.minimumAmount;
//       });
//       if (qualifiedProducts.length === 0) {
//         return {
//           success: false,
//           message: "No products meet the minimum amount requirement for this coupon",
//           discountAmount: 0,
//           updatedProducts: orderProducts,
//         };
//       }

//       // Step 6: Calculate remaining usage for this user
//       const remainingUsage = coupon.usageLimitPerUser
//         ? coupon.usageLimitPerUser - userUsageCount
//         : availableProducts.length; // If no limit, use all available products

//       // Step 7: Sort available products by total price (highest first) for optimal discount
//       // This ensures higher-value products get discounts first (like Amazon/Flipkart)
//       const sortedProducts = availableProducts
//         .map((product) => {
//           const unitPrice = product.variant
//             ? parseFloat(product.variant.price)
//             : parseFloat(product.product.price);
//           const totalPrice = unitPrice * product.quantity;
          
//           return {
//             ...product,
//             unitPrice,
//             totalPrice,
//             originalIndex: orderProducts.findIndex(p => p.productId === product.productId),
//           };
//         })
//         .sort((a, b) => b.totalPrice - a.totalPrice);


//       console.log("Sorted products by price:", sortedProducts.map(p => ({ 
//         id: p.productId, 
//         totalPrice: p.totalPrice 
//       })));

//       // Step 8: Apply discount to products
//       let totalDiscountAmount = 0;
//       let usageCount = 0;
//       const maxUsage = Math.min(remainingUsage, sortedProducts.length);
//       const updatedProducts = [...orderProducts];
//       const couponUsages = [];

//       for (let i = 0; i < maxUsage && i < sortedProducts.length; i++) {
//         const product = sortedProducts[i];
//         let discountAmount = 0;

//         // Calculate discount based on coupon type
//         if (coupon.type === "percentage") {
//           // Apply percentage to the total product amount (unitPrice * quantity)
//           discountAmount = (product.totalPrice * parseFloat(coupon.value)) / 100;
//         } else if (coupon.type === "fixed") {
//           // Apply fixed discount (but not more than the product total)
//           discountAmount = Math.min(parseFloat(coupon.value), product.totalPrice);
//         }

//         // Apply maximum discount amount limit if specified
//         if (coupon.maxDiscountAmount && coupon.maxDiscountAmount > 0) {
//           discountAmount = Math.min(discountAmount, parseFloat(coupon.maxDiscountAmount));
//         }

//         // Ensure discount doesn't exceed product total price
//         discountAmount = Math.min(discountAmount, product.totalPrice);

//         // Round to 2 decimal places
//         discountAmount = Math.round(discountAmount * 100) / 100;

//         if (discountAmount > 0) {
//           totalDiscountAmount += discountAmount;
//           usageCount++;

//           // Update the original product in the order
//           const originalProduct = updatedProducts[product.originalIndex];
//           if (!originalProduct.appliedCoupons) {
//             originalProduct.appliedCoupons = [];
//           }

//           originalProduct.appliedCoupons.push({
//             couponId: coupon.id,
//             couponCode: coupon.code,
//             discountAmount: discountAmount,
//             appliedToPrice: product.totalPrice,
//             couponType: coupon.type,
//             couponValue: coupon.value,
//           });

//           // Create coupon usage record
//           couponUsages.push({
//             userId: userId,
//             couponId: coupon.id,
//             productId: product.productId,
//             discountAmount: discountAmount,
//             originalPrice: product.totalPrice,
//             quantity: product.quantity,
//             usedAt: now,
//           });

//           console.log(`Applied ${coupon.code} to product ${product.productId}: $${discountAmount} discount`);
//         }
//       }

//       // Step 9: Save coupon usage records
//       if (couponUsages.length > 0) {
//         try {
//           await CouponUsage.bulkCreate(couponUsages, {
//             transaction,
//             ignoreDuplicates: false,
//           });
//         } catch (error) {
//           if (error.name === "SequelizeUniqueConstraintError") {
//             return {
//               success: false,
//               message: "This coupon has already been used on some of these products",
//               discountAmount: 0,
//               updatedProducts: orderProducts,
//             };
//           }
//           throw error;
//         }
//       }

//       // Step 10: Update coupon used count
//       if (usageCount > 0) {
//         await coupon.update(
//           { usedCount: (coupon.usedCount || 0) + usageCount },
//           { transaction }
//         );
//       }

//       // Step 11: Calculate total coupon discount per product for display
//       updatedProducts.forEach((product) => {
//         if (product.appliedCoupons && product.appliedCoupons.length > 0) {
//           product.totalCouponDiscount = product.appliedCoupons.reduce(
//             (sum, coupon) => sum + coupon.discountAmount,
//             0
//           );
//           product.totalCouponDiscount = Math.round(product.totalCouponDiscount * 100) / 100;
//         } else {
//           product.totalCouponDiscount = 0;
//         }
//       });

//       return {
//         success: true,
//         message: `Coupon ${coupon.code} applied successfully`,
//         discountAmount: Math.round(totalDiscountAmount * 100) / 100,
//         usageCount: usageCount,
//         updatedProducts: updatedProducts,
//         couponDetails: {
//           id: coupon.id,
//           code: coupon.code,
//           name: coupon.name,
//           type: coupon.type,
//           value: coupon.value,
//           maxDiscountAmount: coupon.maxDiscountAmount,
//         },
//       };
//     } catch (error) {
//       console.error(`Error applying coupon ${coupon.code}:`, error);
//       return {
//         success: false,
//         message: "Error applying coupon",
//         discountAmount: 0,
//         updatedProducts: orderProducts,
//         error: error.message,
//       };
//     }
//   }

//   try {
//     // Step 1: Validate input
//     if (!codesArray || codesArray.length === 0) {
//       return {
//         success: false,
//         totalDiscountAmount: 0,
//         updatedProducts: orderProducts,
//         appliedCoupons: [],
//         failedCoupons: [],
//       };
//     }

//     if (!orderProducts || orderProducts.length === 0) {
//       return {
//         success: false,
//         totalDiscountAmount: 0,
//         updatedProducts: [],
//         appliedCoupons: [],
//         failedCoupons: codesArray.map((code) => ({
//           code: code,
//           reason: "No products in order",
//         })),
//       };
//     }

//     // Step 2: Get coupons by codes
//     const coupons = await Coupon.findAll({
//       where: {
//         code: {
//           [Op.in]: codesArray
//         }
//       },
//       transaction,
//     });

//     if (coupons.length === 0) {
//       return {
//         success: false,
//         totalDiscountAmount: 0,
//         updatedProducts: orderProducts,
//         appliedCoupons: [],
//         failedCoupons: codesArray.map((code) => ({
//           code: code,
//           reason: "Coupon not found",
//         })),
//       };
//     }

//     // Step 3: Check for codes that weren't found
//     const foundCodes = coupons.map(c => c.code);
//     const notFoundCodes = codesArray.filter(code => !foundCodes.includes(code));
    
//     notFoundCodes.forEach(code => {
//       failedCoupons.push({
//         code: code,
//         reason: "Coupon not found",
//       });
//     });

//     // Step 4: Sort coupons by priority (percentage first, then by value descending)
//     // This ensures optimal discount application
//     const sortedCoupons = coupons.sort((a, b) => {
//       if (a.type === "percentage" && b.type === "fixed") return -1;
//       if (a.type === "fixed" && b.type === "percentage") return 1;
//       return parseFloat(b.value) - parseFloat(a.value);
//     });

//     // Step 5: Apply each coupon sequentially
//     for (const coupon of sortedCoupons) {
//       const result = await applySingleCoupon(
//         coupon,
//         userId,
//         updatedProducts,
//         transaction
//       );

//       if (result.success) {
//         totalDiscountAmount += result.discountAmount;
//         updatedProducts = result.updatedProducts;
//         appliedCoupons.push({
//           couponId: coupon.id,
//           couponCode: coupon.code,
//           discountAmount: result.discountAmount,
//           usageCount: result.usageCount,
//           couponDetails: result.couponDetails,
//         });
//       } else {
//         failedCoupons.push({
//           couponId: coupon.id,
//           couponCode: coupon.code,
//           reason: result.message,
//         });
//       }
//     }

//     console.log(`Total discount applied: $${totalDiscountAmount}`);
//     console.log(`Applied coupons: ${appliedCoupons.length}`);
//     console.log(`Failed coupons: ${failedCoupons.length}`);

//     return {
//       success: appliedCoupons.length > 0,
//       totalDiscountAmount: Math.round(totalDiscountAmount * 100) / 100,
//       updatedProducts: updatedProducts,
//       appliedCoupons: appliedCoupons,
//       failedCoupons: failedCoupons,
//     };

//   } catch (error) {
//     console.error("Error in applyCouponToOrder:", error);
//     return {
//       success: false,
//       totalDiscountAmount: 0,
//       updatedProducts: orderProducts,
//       appliedCoupons: [],
//       failedCoupons: codesArray.map((code) => ({
//         code: code,
//         reason: "System error occurred",
//       })),
//       error: error.message,
//     };
//   }
// }


export const applyCouponToOrder = async (couponCodes, userId, orderProducts, transaction = null) => {

    try {

       const applySingleCoupon = async (coupon, userId, orderProducts, transaction) => {
         try {
         
           // Step 1: Validate coupon status and dates
           const now = new Date();
           if (!coupon.isActive) {
             return {
               success: false,
               message: "Coupon is not active",
               discountAmount: 0,
               updatedProducts: orderProducts,
             };
           }
           if (coupon.startDate && new Date(coupon.startDate) > now) {
             return {
               success: false,
               message: "Coupon is not yet valid",
               discountAmount: 0,
               updatedProducts: orderProducts,
             };
           }
            if (coupon.endDate && new Date(coupon.endDate) < now) {
              return {
                success: false,
                message: "Coupon has expired",
                discountAmount: 0,
                updatedProducts: orderProducts,
              };
            }

            // Step 2: Check overall usage limit
            if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
              return {
                success: false,
                message: "Coupon usage limit exceeded",
                discountAmount: 0,
                updatedProducts: orderProducts,
              };
            }
            // Step 3: Get existing coupon usage for this user
            const existingUsages = await CouponUsage.findAll({
              where: { userId, couponId: coupon.id },
              transaction,
            });
            const userUsageCount = existingUsages.length;
            // Check per-user usage limit
            if (coupon.usageLimitPerUser && userUsageCount >= coupon.usageLimitPerUser) {
              return {
                success: false,
                message: "You have reached the usage limit for this coupon",
                discountAmount: 0,
                updatedProducts: orderProducts,
              };
            }
            // Get products already used with this coupon by this user
            const usedProductIds = existingUsages.map((usage) => usage.productId);
            // Step 4: Determine eligible products
            let eligibleProducts = [...orderProducts];
            // Filter by applicable products if not global
            if (!coupon.isGlobal && coupon.applicableProducts && coupon.applicableProducts.length >
                0) {
              eligibleProducts = orderProducts.filter((product) =>
                coupon.applicableProducts.includes(product.productId)
              );
              if (eligibleProducts.length === 0) {
                return {
                  success: false,
                  message: "Coupon is not applicable to any products in your order",
                  discountAmount: 0,
                  updatedProducts: orderProducts,
                };
              }
            }
            // Filter out products already used with this coupon by this user
            const availableProducts = eligibleProducts.filter(
              (product) => !usedProductIds.includes(product.productId)
            );
            console.log(`Available products after filtering: ${availableProducts.length}`);
            if (availableProducts.length === 0) {
              return {
                success: false,
                message: "You have already used this coupon on all applicable products",
                discountAmount: 0,
                updatedProducts: orderProducts,
              };
            }
            // Step 5: Calculate total order amount for minimum amount validation
            const totalEligibleAmount = eligibleProducts.reduce((sum, product) => {
              const unitPrice = product.variant
                ? parseFloat(product.variant.price)
                : parseFloat(product.product.price);
              return sum + (unitPrice * product.quantity);
            }, 0);
            console.log(`Total eligible amount: ${totalEligibleAmount}, Minimum required: ${coupon.minimumAmount}`);

          
           
            // Step 6: Calculate remaining usage for this user
            const remainingUsage = coupon.usageLimitPerUser
              ? coupon.usageLimitPerUser - userUsageCount
              : availableProducts.length; // If no limit, use all available products

              if(remainingUsage <= 0) {
                return {
                  success: false,
                  message: "You have reached the usage limit for this coupon",
                  discountAmount: 0,
                  updatedProducts: orderProducts,
                };
              }
              let discountAmount = coupon.type === "percentage" ?
                (totalEligibleAmount * parseFloat(coupon.value)) / 100 :
                Math.min(parseFloat(coupon.value), totalEligibleAmount);

                console.log(`Calculated discount amount: $${discountAmount}`);

                // calculate for fixed discount
                if (coupon.type === "fixed" && coupon.maxDiscountAmount) {
                  discountAmount = Math.min(discountAmount, parseFloat(coupon.maxDiscountAmount));
                }

                // round to integer
                console.log(`Discount amount before rounding: $${discountAmount}`);
                discountAmount = Math.round(discountAmount * 100) / 100;
                console.log(`Final discount amount after max limit: $${discountAmount}`);

                // ensure discount is not less than minimum amount and not more than maximum amount
                if (coupon.minimumAmount && totalEligibleAmount < coupon.minimumAmount) {
                  return {
                    success: false,
                    message: `Minimum order amount of $${coupon.minimumAmount} required for eligible products. Current eligible amount: $${totalEligibleAmount.toFixed(2)}`,
                    discountAmount: 0,
                    updatedProducts: orderProducts,
                  };
                }
                if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
                  discountAmount = coupon.maxDiscountAmount;
                }
                console.log(`Final discount amount after all checks: $${discountAmount}`);

                // update on database model 
                console.log(typeof(discountAmount))

                




            


         } catch (error) {
           console.error(`Error processing coupon ${coupon.code}:`, error);
           return {
             success: false,
             message: "Error processing coupon",
             discountAmount: 0,
             updatedProducts: orderProducts,
             error: error.message,
           };
         }
       }

        // Ensure couponCodes is always an array
        const codesArray = Array.isArray(couponCodes) ? couponCodes : [couponCodes];
        


        // Step 1: Validate input
        if (!codesArray || codesArray.length === 0) {
            return {
                success: false,
                totalDiscountAmount: 0,
                updatedProducts: orderProducts,
                appliedCoupons: [],
                failedCoupons: [],
            };
        }

        if (!orderProducts || orderProducts.length === 0) {
            return {
                success: false,
                totalDiscountAmount: 0,
                updatedProducts: [],
                appliedCoupons: [],
                failedCoupons: codesArray.map((code) => ({
                    code: code,
                    reason: "No products in order",
                })),
            };
        }

        // Step 2: Get coupons by codes
        const coupons = await Coupon.findAll({
            where: {
                code: {
                    [Op.in]: codesArray
                }
            },
            transaction,
        });

        if (coupons.length === 0) {
            return {
                success: false,
                totalDiscountAmount: 0,
                updatedProducts: orderProducts,
                appliedCoupons: [],
                failedCoupons: codesArray.map((code) => ({
                    code: code,
                    reason: "Coupon not found",
                })),
            };
        }

        // Step 3: Check for codes that weren't found
        const foundCodes = coupons.map(c => c.code);
        const notFoundCodes = codesArray.filter(code => !foundCodes.includes(code));
        const failedCoupons = notFoundCodes.map(code => ({
            code: code,
            reason: "Coupon not found",
        }));
        // Step 4: Sort coupons by priority (percentage first, then by value descending)
        // This ensures optimal discount application
        const sortedCoupons = coupons.sort((a, b) => {
            if (a.type === "percentage" && b.type === "fixed") return -1;
            if (a.type === "fixed" && b.type === "percentage") return 1;
            return parseFloat(b.value) - parseFloat(a.value);
        });
        let totalDiscountAmount = 0;
        let updatedProducts = [...orderProducts];
        const appliedCoupons = [];
        // Step 5: Apply each coupon sequentially

        for (const coupon of sortedCoupons) {
            console.log(`Processing coupon: ${typeof(coupon.minimumAmount)}`);
            console.log(userId, "userId");
            console.log(updatedProducts, "updatedProducts");
            // console.log(transaction, "transaction");
            const result = await applySingleCoupon(
                coupon,
                userId,
                updatedProducts,
                transaction
            );
            console.log(result, "result of applySingleCoupon");

            if (result.success) {
                totalDiscountAmount += result.discountAmount;
                updatedProducts = result.updatedProducts;
                appliedCoupons.push({
                    couponId: coupon.id,
                    couponCode: coupon.code,
                    discountAmount: result.discountAmount,
                    usageCount: result.usageCount,
                    couponDetails: result.couponDetails,
                });
            } else {
                failedCoupons.push({
                    couponId: coupon.id,
                    couponCode: coupon.code,
                    reason: result.message,
                });
            }
        }




    }catch (error) {
        console.error("Error applying coupon to order:", error);
        return {
            success: false,
            message: "Error applying coupon",
            discountAmount: 0,
            updatedProducts: orderProducts,
            error: error.message,
        };
    }
}


export const applyCoupon = async (req,res) => {

    try {

       const applySingleCoupon = async (coupon, userId, orderProducts, transaction) => {
         try {
         
           // Step 1: Validate coupon status and dates
           const now = new Date();
           if (!coupon.isActive) {
             return {
               success: false,
               message: "Coupon is not active",
               discountAmount: 0,
               updatedProducts: orderProducts,
             };
           }
           if (coupon.startDate && new Date(coupon.startDate) > now) {
             return {
               success: false,
               message: "Coupon is not yet valid",
               discountAmount: 0,
               updatedProducts: orderProducts,
             };
           }
            if (coupon.endDate && new Date(coupon.endDate) < now) {
              return {
                success: false,
                message: "Coupon has expired",
                discountAmount: 0,
                updatedProducts: orderProducts,
              };
            }

            // Step 2: Check overall usage limit
            if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
              return {
                success: false,
                message: "Coupon usage limit exceeded",
                discountAmount: 0,
                updatedProducts: orderProducts,
              };
            }
            // Step 3: Get existing coupon usage for this user
            const existingUsages = await CouponUsage.findAll({
              where: { userId, couponId: coupon.id },
              transaction,
            });
            const userUsageCount = existingUsages.length;
            // Check per-user usage limit
            if (coupon.usageLimitPerUser && userUsageCount >= coupon.usageLimitPerUser) {
              return {
                success: false,
                message: "You have reached the usage limit for this coupon",
                discountAmount: 0,
                updatedProducts: orderProducts,
              };
            }
            // Get products already used with this coupon by this user
            const usedProductIds = existingUsages.map((usage) => usage.productId);
            // Step 4: Determine eligible products
            let eligibleProducts = [...orderProducts];
            // Filter by applicable products if not global
            if (!coupon.isGlobal && coupon.applicableProducts && coupon.applicableProducts.length >
                0) {
              eligibleProducts = orderProducts.filter((product) =>
                coupon.applicableProducts.includes(product.productId)
              );
              if (eligibleProducts.length === 0) {
                return {
                  success: false,
                  message: "Coupon is not applicable to any products in your order",
                  discountAmount: 0,
                  updatedProducts: orderProducts,
                };
              }
            }
            // Filter out products already used with this coupon by this user
            const availableProducts = eligibleProducts.filter(
              (product) => !usedProductIds.includes(product.productId)
            );
            console.log(`Available products after filtering: ${availableProducts.length}`);
            if (availableProducts.length === 0) {
              return {
                success: false,
                message: "You have already used this coupon on all applicable products",
                discountAmount: 0,
                updatedProducts: orderProducts,
              };
            }
            // Step 5: Calculate total order amount for minimum amount validation
            const totalEligibleAmount = eligibleProducts.reduce((sum, product) => {
              const unitPrice = product.variant
                ? parseFloat(product.variant.price)
                : parseFloat(product.product.price);
              return sum + (unitPrice * product.quantity);
            }, 0);
            console.log(`Total eligible amount: ${totalEligibleAmount}, Minimum required: ${coupon.minimumAmount}`);

          
           
            // Step 6: Calculate remaining usage for this user
            const remainingUsage = coupon.usageLimitPerUser
              ? coupon.usageLimitPerUser - userUsageCount
              : availableProducts.length; // If no limit, use all available products

              if(remainingUsage <= 0) {
                return {
                  success: false,
                  message: "You have reached the usage limit for this coupon",
                  discountAmount: 0,
                  updatedProducts: orderProducts,
                };
              }
              let discountAmount = coupon.type === "percentage" ?
                (totalEligibleAmount * parseFloat(coupon.value)) / 100 :
                Math.min(parseFloat(coupon.value), totalEligibleAmount);

                console.log(`Calculated discount amount: $${discountAmount}`);

                // calculate for fixed discount
                if (coupon.type === "fixed" && coupon.maxDiscountAmount) {
                  discountAmount = Math.min(discountAmount, parseFloat(coupon.maxDiscountAmount));
                }

                // round to integer
                discountAmount = Math.round(discountAmount * 100) / 100;
                console.log(`Final discount amount after max limit: $${discountAmount}`);

                // ensure discount is not less than minimum amount and not more than maximum amount
                if (coupon.minimumAmount && totalEligibleAmount < coupon.minimumAmount) {
                  return {
                    success: false,
                    message: `Minimum order amount of $${coupon.minimumAmount} required for eligible products. Current eligible amount: $${totalEligibleAmount.toFixed(2)}`,
                    discountAmount: 0,
                    updatedProducts: orderProducts,
                  };
                }
                if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
                  discountAmount = coupon.maxDiscountAmount;
                }
                console.log(`Final discount amount after all checks: $${discountAmount}`);

                




            


         } catch (error) {
           console.error(`Error processing coupon ${coupon.code}:`, error);
           return {
             success: false,
             message: "Error processing coupon",
             discountAmount: 0,
             updatedProducts: orderProducts,
             error: error.message,
           };
         }
       }

        // Ensure couponCodes is always an array
        const codesArray = Array.isArray(couponCodes) ? couponCodes : [couponCodes];
        


        // Step 1: Validate input
        if (!codesArray || codesArray.length === 0) {
            return {
                success: false,
                totalDiscountAmount: 0,
                updatedProducts: orderProducts,
                appliedCoupons: [],
                failedCoupons: [],
            };
        }

        if (!orderProducts || orderProducts.length === 0) {
            return {
                success: false,
                totalDiscountAmount: 0,
                updatedProducts: [],
                appliedCoupons: [],
                failedCoupons: codesArray.map((code) => ({
                    code: code,
                    reason: "No products in order",
                })),
            };
        }

        // Step 2: Get coupons by codes
        const coupons = await Coupon.findAll({
            where: {
                code: {
                    [Op.in]: codesArray
                }
            },
            transaction,
        });

        if (coupons.length === 0) {
            return {
                success: false,
                totalDiscountAmount: 0,
                updatedProducts: orderProducts,
                appliedCoupons: [],
                failedCoupons: codesArray.map((code) => ({
                    code: code,
                    reason: "Coupon not found",
                })),
            };
        }

        // Step 3: Check for codes that weren't found
        const foundCodes = coupons.map(c => c.code);
        const notFoundCodes = codesArray.filter(code => !foundCodes.includes(code));
        const failedCoupons = notFoundCodes.map(code => ({
            code: code,
            reason: "Coupon not found",
        }));
        // Step 4: Sort coupons by priority (percentage first, then by value descending)
        // This ensures optimal discount application
        const sortedCoupons = coupons.sort((a, b) => {
            if (a.type === "percentage" && b.type === "fixed") return -1;
            if (a.type === "fixed" && b.type === "percentage") return 1;
            return parseFloat(b.value) - parseFloat(a.value);
        });
        let totalDiscountAmount = 0;
        let updatedProducts = [...orderProducts];
        const appliedCoupons = [];
        // Step 5: Apply each coupon sequentially

        for (const coupon of sortedCoupons) {
            console.log(`Processing coupon: ${typeof(coupon.minimumAmount)}`);
            console.log(userId, "userId");
            console.log(updatedProducts, "updatedProducts");
            // console.log(transaction, "transaction");
            const result = await applySingleCoupon(
                coupon,
                userId,
                updatedProducts,
                transaction
            );
            console.log(result, "result of applySingleCoupon");

            if (result.success) {
                totalDiscountAmount += result.discountAmount;
                updatedProducts = result.updatedProducts;
                appliedCoupons.push({
                    couponId: coupon.id,
                    couponCode: coupon.code,
                    discountAmount: result.discountAmount,
                    usageCount: result.usageCount,
                    couponDetails: result.couponDetails,
                });
            } else {
                failedCoupons.push({
                    couponId: coupon.id,
                    couponCode: coupon.code,
                    reason: result.message,
                });
            }
        }




    }catch (error) {
        console.error("Error applying coupon to order:", error);
        return {
            success: false,
            message: "Error applying coupon",
            discountAmount: 0,
            updatedProducts: orderProducts,
            error: error.message,
        };
    }
}