import { Coupon, CouponUsage, Product } from "../models/index.model.js";
import { Op } from "sequelize";

// function only not api

export async function applyCouponToOrder(
  couponIds,
  userId,
  orderProducts,
  transaction
) {
  let totalDiscountAmount = 0;
  let updatedProducts = [...orderProducts];
  const appliedCoupons = [];
  const failedCoupons = [];

  async function applySingleCoupon(
    couponId,
    userId,
    orderProducts,
    transaction
  ) {
    try {
      // Step 1: Validate coupon existence and basic properties
      const coupon = await Coupon.findByPk(couponId, { transaction });
      if (!coupon) {
        return {
          success: false,
          message: "Coupon not found",
          discountAmount: 0,
          updatedProducts: orderProducts,
        };
      }

      // Step 2: Validate coupon status and dates
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

      // Additional validation: Check if coupon is soft deleted (paranoid: true)
      if (coupon.deletedAt) {
        return {
          success: false,
          message: "Coupon is no longer available",
          discountAmount: 0,
          updatedProducts: orderProducts,
        };
      }

      // Step 3: Check overall usage limit
      if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
        return {
          success: false,
          message: "Coupon usage limit exceeded",
          discountAmount: 0,
          updatedProducts: orderProducts,
        };
      }

      // Step 4: Get existing coupon usage for this user
      const existingUsages = await CouponUsage.findAll({
        where: { userId, couponId },
        transaction,
      });

      const userUsageCount = existingUsages.length;

      if (
        coupon.usageLimitPerUser &&
        userUsageCount >= coupon.usageLimitPerUser
      ) {
        return {
          success: false,
          message: "User coupon usage limit exceeded",
          discountAmount: 0,
          updatedProducts: orderProducts,
        };
      }

      // Step 5: Calculate remaining usage for this user
      const remainingUsage = coupon.usageLimitPerUser
        ? coupon.usageLimitPerUser - userUsageCount
        : Number.MAX_SAFE_INTEGER;

      // Step 6: Get already used product IDs for this user and coupon
      const usedProductIds = existingUsages.map((usage) => usage.productId);

      // Step 7: Check if coupon is applicable to products (if not global)
      if (
        !coupon.isGlobal &&
        coupon.applicableProducts &&
        coupon.applicableProducts.length > 0
      ) {
        const hasApplicableProduct = orderProducts.some((product) =>
          coupon.applicableProducts.includes(product.productId)
        );

        if (!hasApplicableProduct) {
          return {
            success: false,
            message: "Coupon is not applicable to any products in the order",
            discountAmount: 0,
            updatedProducts: orderProducts,
          };
        }
      }

      // Step 7: Prepare products for discount calculation
      const productsForDiscount = [];

      orderProducts.forEach((orderProduct) => {
        // Check if product is eligible (for non-global coupons)
        if (
          !coupon.isGlobal &&
          coupon.applicableProducts &&
          coupon.applicableProducts.length > 0
        ) {
          if (!coupon.applicableProducts.includes(orderProduct.productId)) {
            return; // Skip this product
          }
        }

        // Determine price based on variant or product
        const unitPrice = orderProduct.variant
          ? orderProduct.variant.price
          : orderProduct.product.price;

        // Create individual items for each quantity
        for (let i = 0; i < orderProduct.quantity; i++) {
          productsForDiscount.push({
            ...orderProduct,
            unitPrice: unitPrice,
            quantity: 1, // Individual item
            originalIndex: orderProducts.indexOf(orderProduct),
          });
        }
      });

      // Step 8: Sort products by price (highest first) for optimal discount application
      productsForDiscount.sort((a, b) => b.unitPrice - a.unitPrice);

      // Step 9: Check minimum amount requirement
      const totalOrderAmount = productsForDiscount.reduce(
        (sum, item) => sum + item.unitPrice,
        0
      );
      if (coupon.minimumAmount && totalOrderAmount < coupon.minimumAmount) {
        return {
          success: false,
          message: `Minimum order amount of ${coupon.minimumAmount} required`,
          discountAmount: 0,
          updatedProducts: orderProducts,
        };
      }

      // Step 10: Apply discount to products
      let totalDiscountAmount = 0;
      let usageCount = 0;
      const maxUsage = Math.min(remainingUsage, productsForDiscount.length);
      const updatedProducts = [...orderProducts];
      const couponUsages = [];

      for (let i = 0; i < maxUsage && i < productsForDiscount.length; i++) {
        const product = productsForDiscount[i];
        let discountAmount = 0;

        // Calculate discount based on coupon type
        if (coupon.type === "percentage") {
          discountAmount = (product.unitPrice * coupon.value) / 100;
        } else if (coupon.type === "fixed") {
          discountAmount = Math.min(coupon.value, product.unitPrice);
        }

        // Apply maximum discount amount limit
        if (coupon.maxDiscountAmount) {
          discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
        }

        // Ensure discount doesn't exceed product price
        discountAmount = Math.min(discountAmount, product.unitPrice);

        totalDiscountAmount += discountAmount;
        usageCount++;

        // Update the original product in the order
        const originalProduct = updatedProducts[product.originalIndex];
        if (!originalProduct.appliedCoupons) {
          originalProduct.appliedCoupons = [];
        }

        originalProduct.appliedCoupons.push({
          couponId: couponId,
          discountAmount: discountAmount,
          appliedToPrice: product.unitPrice,
        });

        // Create coupon usage record
        couponUsages.push({
          userId: userId,
          couponId: couponId,
          productId: product.productId,
          discountAmount: discountAmount,
          originalPrice: product.unitPrice,
          usedAt: now,
        });
      }

      // Step 11: Save coupon usage records
      if (couponUsages.length > 0) {
        await CouponUsage.bulkCreate(couponUsages, { transaction });
      }

      // Step 12: Update coupon used count
      await coupon.update(
        { usedCount: coupon.usedCount + usageCount },
        { transaction }
      );

      // Step 13: Calculate final discount per product for order summary
      updatedProducts.forEach((product) => {
        if (product.appliedCoupons && product.appliedCoupons.length > 0) {
          product.totalCouponDiscount = product.appliedCoupons.reduce(
            (sum, coupon) => sum + coupon.discountAmount,
            0
          );
        } else {
          product.totalCouponDiscount = 0;
        }
      });

      return {
        success: true,
        message: "Coupon applied successfully",
        discountAmount: totalDiscountAmount,
        usageCount: usageCount,
        updatedProducts: updatedProducts,
        couponDetails: {
          code: coupon.code,
          name: coupon.name,
          type: coupon.type,
          value: coupon.value,
        },
      };
    } catch (error) {
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

  for (const couponId of couponIds) {
    const result = await applySingleCoupon(
      couponId,
      userId,
      orderProducts,
      transaction
    );

    if (result.success) {
      totalDiscountAmount += result.discountAmount;
      updatedProducts = result.updatedProducts;
      appliedCoupons.push({
        couponId: couponId,
        discountAmount: result.discountAmount,
        usageCount: result.usageCount,
        couponDetails: result.couponDetails,
      });
    } else {
      failedCoupons.push({
        couponId: couponId,
        reason: result.message,
      });
    }
  }

  return {
    success: appliedCoupons.length > 0,
    totalDiscountAmount: totalDiscountAmount,
    updatedProducts: updatedProducts,
    appliedCoupons: appliedCoupons,
    failedCoupons: failedCoupons,
  };
}

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
    const updatedStartDate = startDate !== undefined ? startDate : existingCoupon.startDate;
    const updatedEndDate = endDate !== undefined ? endDate : existingCoupon.endDate;
    
    if (updatedStartDate && updatedEndDate && new Date(updatedStartDate) >= new Date(updatedEndDate)) {
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
    if (maxDiscountAmount !== undefined) updateData.maxDiscountAmount = maxDiscountAmount;
    if (minimumAmount !== undefined) updateData.minimumAmount = minimumAmount;
    if (usageLimit !== undefined) updateData.usageLimit = usageLimit;
    if (usageLimitPerUser !== undefined) updateData.usageLimitPerUser = usageLimitPerUser;
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
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

async function checkDiscountAmount(
  couponCodes,
  userId,
  products,
  transaction = null
) {
  try {
    // Validate input
    if (!Array.isArray(couponCodes) || couponCodes.length === 0) {
      throw new Error("At least one coupon code is required");
    }

    // Remove duplicates and convert to uppercase
    const uniqueCouponCodes = [
      ...new Set(couponCodes.map((code) => code.toUpperCase())),
    ];

    // Fetch all coupons (READ ONLY)
    const coupons = await Coupon.findAll({
      where: {
        code: uniqueCouponCodes,
        isActive: true,
      },
      transaction,
    });

    if (coupons.length === 0) {
      return {
        canApply: false,
        error: "No valid coupons found",
        totalAmount: 0,
        appliedCoupons: [],
        summary: {
          totalCouponsApplied: 0,
          totalCouponsProvided: uniqueCouponCodes.length,
          totalDiscount: 0,
        },
      };
    }

    // Check for any missing coupons
    const foundCouponCodes = coupons.map((c) => c.code);
    const missingCoupons = uniqueCouponCodes.filter(
      (code) => !foundCouponCodes.includes(code)
    );
    if (missingCoupons.length > 0) {
      return {
        canApply: false,
        error: `Coupons not found or inactive: ${missingCoupons.join(", ")}`,
        totalAmount: 0,
        appliedCoupons: [],
        summary: {
          totalCouponsApplied: 0,
          totalCouponsProvided: uniqueCouponCodes.length,
          totalDiscount: 0,
        },
      };
    }

    const now = new Date();
    let totalDiscountAmount = 0;
    let appliedCoupons = [];
    let skippedCoupons = [];
    let remainingProducts = [...products];

    // Calculate subtotal
    let subtotal = 0;
    for (const item of products) {
      const price = parseFloat(item.price);
      const stock = parseInt(item.stock);
      subtotal += price * stock;
    }

    // Process each coupon (READ ONLY - NO DATABASE CHANGES)
    for (const coupon of coupons) {
      try {
        // Date validation
        if (coupon.startDate && now < new Date(coupon.startDate)) {
          throw new Error(`Coupon ${coupon.code} is not yet active`);
        }
        if (coupon.endDate && now > new Date(coupon.endDate)) {
          throw new Error(`Coupon ${coupon.code} has expired`);
        }

        // Usage limit validation
        if (coupon.usedCount >= coupon.usageLimit) {
          throw new Error(`Coupon ${coupon.code} usage limit exceeded`);
        }

        // User usage validation (READ ONLY)
        const userUsageCount = await CouponUsage.count({
          where: {
            userId,
            couponId: coupon.id,
          },
          transaction,
        });

        if (userUsageCount >= coupon.usageLimitPerUser) {
          throw new Error(
            `User coupon usage limit exceeded for ${coupon.code}`
          );
        }

        // Minimum amount validation (check against total subtotal)
        if (subtotal < coupon.minimumAmount) {
          throw new Error(
            `Minimum order amount of ${coupon.minimumAmount} not met for coupon ${coupon.code}`
          );
        }

        // Find applicable products from remaining products
        let allApplicableProducts = [];

        for (const item of remainingProducts) {
          const price = parseFloat(item.price);
          const stock = parseInt(item.stock);
          const itemTotal = price * stock;

          if (
            coupon.isGlobal ||
            coupon.applicableProducts.includes(item.product)
          ) {
            allApplicableProducts.push({
              ...item,
              price,
              stock,
              itemTotal,
            });
          }
        }

        if (allApplicableProducts.length === 0) {
          throw new Error(
            `Coupon ${coupon.code} is not applicable to any remaining products in cart`
          );
        }

        // Check product-specific usage limits (READ ONLY)
        let availableProducts = [];

        for (const item of allApplicableProducts) {
          const productUsageCount = await CouponUsage.count({
            where: {
              userId,
              couponId: coupon.id,
              productId: item.product,
            },
            transaction,
          });

          if (productUsageCount < coupon.usageLimitPerUser) {
            availableProducts.push(item);
          }
        }

        if (availableProducts.length === 0) {
          throw new Error(
            `Coupon ${coupon.code} usage limit exceeded for all applicable products`
          );
        }

        // Calculate how many products this coupon can be applied to
        const remainingUserUsage = coupon.usageLimitPerUser - userUsageCount;
        const maxProductsToApply = Math.min(
          remainingUserUsage,
          availableProducts.length
        );

        // Sort by highest value first to maximize discount
        availableProducts.sort((a, b) => b.itemTotal - a.itemTotal);
        const productsToApply = availableProducts.slice(0, maxProductsToApply);

        // Calculate discount for this coupon (SIMULATION ONLY)
        let couponDiscountAmount = 0;
        let appliedProducts = [];

        for (const item of productsToApply) {
          let itemDiscount = 0;

          if (coupon.type === "percentage") {
            itemDiscount = (item.itemTotal * coupon.value) / 100;
          } else if (coupon.type === "fixed") {
            itemDiscount = Math.min(coupon.value, item.itemTotal);
          }

          itemDiscount = Math.min(itemDiscount, coupon.maxDiscountAmount);
          couponDiscountAmount += itemDiscount;

          appliedProducts.push({
            productId: item.product,
            itemTotal: item.itemTotal,
            discount: itemDiscount,
          });
        }

        // Ensure discount doesn't exceed applicable subtotal
        const applicableSubtotal = productsToApply.reduce(
          (sum, item) => sum + item.itemTotal,
          0
        );
        couponDiscountAmount = Math.min(
          couponDiscountAmount,
          applicableSubtotal
        );
        couponDiscountAmount = Math.round(couponDiscountAmount * 100) / 100;

        // Add to results (NO DATABASE CHANGES)
        totalDiscountAmount += couponDiscountAmount;
        appliedCoupons.push({
          id: coupon.id,
          code: coupon.code,
          name: coupon.name,
          type: coupon.type,
          value: coupon.value,
          discountAmount: couponDiscountAmount,
          appliedToProducts: appliedProducts,
          productsCount: productsToApply.length,
        });

        // Remove applied products from remaining products for next coupon simulation
        const appliedProductIds = productsToApply.map((p) => p.product);
        remainingProducts = remainingProducts.filter(
          (item) => !appliedProductIds.includes(item.product)
        );
      } catch (couponError) {
        // Track skipped coupons with reasons
        skippedCoupons.push({
          code: coupon.code,
          reason: couponError.message,
        });
        continue;
      }
    }

    totalDiscountAmount = Math.round(totalDiscountAmount * 100) / 100;

    const canApply = appliedCoupons.length > 0;

    return {
      canApply,
      totalAmount: totalDiscountAmount,
      appliedCoupons: appliedCoupons,
      skippedCoupons: skippedCoupons,
      summary: {
        totalCouponsApplied: appliedCoupons.length,
        totalCouponsProvided: uniqueCouponCodes.length,
        totalCouponsSkipped: skippedCoupons.length,
        totalDiscount: totalDiscountAmount,
        subtotal: subtotal,
        finalAmount: subtotal - totalDiscountAmount,
      },
      // Additional details for frontend display
      validation: {
        allCouponsValid: skippedCoupons.length === 0,
        partialSuccess: appliedCoupons.length > 0 && skippedCoupons.length > 0,
        allCouponsFailed:
          appliedCoupons.length === 0 && skippedCoupons.length > 0,
      },
    };
  } catch (error) {
    console.error("Coupon check calculation error:", error.message);
    return {
      canApply: false,
      error: error.message,
      totalAmount: 0,
      appliedCoupons: [],
      skippedCoupons: [],
      summary: {
        totalCouponsApplied: 0,
        totalCouponsProvided: couponCodes ? couponCodes.length : 0,
        totalDiscount: 0,
      },
    };
  }
}

export const applyCoupon = async (req, res) => {
  const { code, cart } = req.body;
  const userId = req.user.id;
  try {
    // Input validation
    if (!code || !userId || !cart || !Array.isArray(cart)) {
      return res.status(400).json({
        success: false,
        message: "Code, userId, and cart are required",
      });
    }

    if (cart.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart cannot be empty",
      });
    }

    let data = await checkDiscountAmount(
      couponCodes,
      userId,
      products,
      (transaction = null)
    );

    return res.status(200).json({
      success: true,
      data,
      message: "Coupon applied successfully",
    });
  } catch (error) {
    console.error("Apply coupon error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to apply coupon",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
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
