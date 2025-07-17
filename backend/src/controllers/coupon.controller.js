import { Coupon, CouponUsage, Product,  } from '../models/index.model.js';
import { Op } from 'sequelize';


// function only not api 


export async function applyCouponToOrder(couponIds, userId, orderProducts, transaction) {
    let totalDiscountAmount = 0;
    let updatedProducts = [...orderProducts];
    const appliedCoupons = [];
    const failedCoupons = [];

    for (const couponId of couponIds) {
       const result = async function applyCouponToOrder(
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
           const usedProductIds = existingUsages.map(
             (usage) => usage.productId
           );

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
                 message:
                   "Coupon is not applicable to any products in the order",
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
               if (
                 !coupon.applicableProducts.includes(orderProduct.productId)
               ) {
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
           if (
             coupon.minimumAmount &&
             totalOrderAmount < coupon.minimumAmount
           ) {
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
           const maxUsage = Math.min(
             remainingUsage,
             productsForDiscount.length
           );
           const updatedProducts = [...orderProducts];
           const couponUsages = [];

           for (
             let i = 0;
             i < maxUsage && i < productsForDiscount.length;
             i++
           ) {
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
               discountAmount = Math.min(
                 discountAmount,
                 coupon.maxDiscountAmount
               );
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
       };
        
        if (result.success) {
            totalDiscountAmount += result.discountAmount;
            updatedProducts = result.updatedProducts;
            appliedCoupons.push({
                couponId: couponId,
                discountAmount: result.discountAmount,
                usageCount: result.usageCount,
                couponDetails: result.couponDetails
            });
        } else {
            failedCoupons.push({
                couponId: couponId,
                reason: result.message
            });
        }
    }

    return {
        success: appliedCoupons.length > 0,
        totalDiscountAmount: totalDiscountAmount,
        updatedProducts: updatedProducts,
        appliedCoupons: appliedCoupons,
        failedCoupons: failedCoupons
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
      applicableProducts = []
    } = req.body;

    // Validate input
    if (!code || !name || !type || !value) {
      return res.status(400).json({
        success: false,
        message: "Code, name, type, and value are required"
      });
    }

    // Validate percentage coupon
    if (type === 'percentage' && value > 100) {
      return res.status(400).json({
        success: false,
        message: "Percentage discount cannot exceed 100%"
      });
    }

    // Validate dates
    if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({
        success: false,
        message: "End date must be after start date"
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
      applicableProducts: isGlobal ? [] : applicableProducts
    });


    return res.status(201).json({
      success: true,
      data: coupon,
      message: "Coupon created successfully"
    });

  } catch (error) {
    console.error('Create coupon error:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        message: "Coupon code already exists"
      });
    }
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors.map(e => e.message)
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create coupon"
    });
  }
};

export const applyCoupon = async (req, res) => {
  const { code,cart } = req.body;
  const userId = req.user.id;
  try {
    // Input validation
    if (!code || !userId || !cart || !Array.isArray(cart)) {
      return res.status(400).json({
        success: false,
        message: "Code, userId, and cart are required"
      });
    }

    if (cart.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart cannot be empty"
      });
    }

    // Find coupon
    const coupon = await Coupon.findOne({
      where: { 
        code: code.toUpperCase(),
        deletedAt: null
      }
    });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Invalid coupon code"
      });
    }

  // Fetch all products from DB by ID
const productIds = cart.map(item => item.productId);
const products = await Product.findAll({
  where: { id: productIds },
  attributes: ['id', 'price'] // Only fetch required fields
});

// Create a map for fast lookup
const productMap = {};
products.forEach(product => {
  productMap[product.id] = product;
});

// Reconstruct the cart with correct prices
const validatedCart = cart.map(item => {
  const product = productMap[item.productId];
  if (!product) {
    return res.status(404).json({
      success: false,
      message: `Product with ID ${item.productId} not found`,
    });

  }
  return {
    productId: item.productId,
    quantity: item.quantity,
    price: parseFloat(product.price)
  };
});

// Calculate order total
const orderTotal = validatedCart.reduce((sum, item) => {
  return sum + (item.price * item.quantity);
}, 0);


    // Check basic validity
    const validity = await coupon.isValid(userId, orderTotal);
    if (!validity.valid) {
      return res.status(400).json({
        success: false,
        message: validity.reason
      });
    }

    // Check per-user usage limit
    if (coupon.usageLimitPerUser) {
      const userUsageCount = await CouponUsage.count({
        where: {
          userId,
          couponId: coupon.id
        }
      });

      if (userUsageCount >= coupon.usageLimitPerUser) {
        return res.status(400).json({
          success: false,
          message: "You have already used this coupon the maximum number of times"
        });
      }
    }

    // Get eligible cart items
    const eligibleItems = await getEligibleItems(validatedCart, coupon);


    if (eligibleItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Coupon does not apply to any items in your cart"
      });
    }

    // Calculate discount on eligible items only
    const eligibleTotal = eligibleItems.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);

    const discount = coupon.calculateDiscount(eligibleTotal);

    return res.status(200).json({
      success: true,
      data: {
        couponId: coupon.id,
        code: coupon.code,
        name: coupon.name,
        discount: parseFloat(discount.toFixed(2)),
        eligibleItems: eligibleItems.map(item => ({
          productId: item.productId,
          price: item.price,
          quantity: item.quantity
        })),
        orderTotal: parseFloat(orderTotal.toFixed(2)),
        finalAmount: parseFloat((orderTotal - discount).toFixed(2))
      },
      message: "Coupon applied successfully"
    });

  } catch (error) {
    console.error('Apply coupon error:', error);
    return res.status(500).json({
      success: false,
      message: "Failed to apply coupon",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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
        message: "Coupon not found"
      });
    }

    
    await coupon.destroy();

    return res.status(200).json({
      success: true,
      message: "Coupon removed successfully"
    });
  } catch (error) {
    console.error('Remove coupon error:', error);
    return res.status(500).json({
      success: false,
      message: "Failed to remove coupon"
    });
  }
};

export const restoreCoupon = async (req, res) => {
  const { couponId } = req.params;

  try {

    const coupon = await Coupon.findOne({
      where: { id: couponId },
      paranoid: false 
    });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found"
      });
    }

    if (coupon.deletedAt === null) {
      return res.status(400).json({
        success: false,
        message: "Coupon is not deleted"
      });
    }

    await coupon.restore();

    return res.status(200).json({
      success: true,
      message: "Coupon restored successfully",
      data: coupon
    });

  } catch (error) {
    console.error('Restore coupon error:', error);
    return res.status(500).json({
      success: false,
      message: "Failed to restore coupon"
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
            [Op.or]: [
              { startDate: null },
              { startDate: { [Op.lte]: now } }
            ]
          },
          {
            [Op.or]: [
              { endDate: null },
              { endDate: { [Op.gte]: now } }
            ]
          },
          {
            [Op.or]: [
              { usageLimit: null },
              { usedCount: { [Op.lt]: { [Op.col]: 'usageLimit' } } }
            ]
          }
        ]
      },
      attributes: ['id', 'code', 'name', 'description', 'type', 'value', 'minimumAmount', 'maxDiscountAmount', 'endDate', 'usageLimitPerUser'],
      order: [['createdAt', 'DESC']]
    });

    const couponIdsWithLimits = coupons
      .filter(c => c.usageLimitPerUser)
      .map(c => c.id);

    const usageCounts = await CouponUsage.findAll({
      where: {
        userId,
        couponId: couponIdsWithLimits
      },
      attributes: ['couponId', [fn('COUNT', col('id')), 'count']],
      group: ['couponId']
    });

    const usageCountMap = {};
    usageCounts.forEach(row => {
      usageCountMap[row.couponId] = parseInt(row.get('count'), 10);
    });

    const availableCoupons = coupons.filter(coupon => {
      if (coupon.usageLimitPerUser) {
        const userUsageCount = usageCountMap[coupon.id] || 0;
        return userUsageCount < coupon.usageLimitPerUser;
      }
      return true;
    });

    return res.status(200).json({
      success: true,
      coupons: availableCoupons,
      count: availableCoupons.length
    });

  } catch (error) {
    console.error('Get user coupons error:', error);
    return res.status(500).json({
      success: false,
      message: "Failed to get user coupons"
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
          as: 'user',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'price']
        }
      ],
      order: [['usedAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return res.status(200).json({
      success: true,
      data: {
        usage: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get coupon usage error:', error);
    return res.status(500).json({
      success: false,
      message: "Failed to get coupon usage"
    });
  }
};

export const getAllCoupons = async (req, res) => {
  const { page = 1, limit = 50 } = req.query;

  try {
    const offset = (page - 1) * limit;

    const { count, rows } = await Coupon.findAndCountAll({
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return res.status(200).json({
      success: true,
      data: {
        coupons: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get all coupons error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get coupons'
    });
  }
};



