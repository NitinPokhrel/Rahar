import { Coupon, CouponUsage, Order, Product, Category } from '../models/index.model.js';
import { Op } from 'sequelize';

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
  const { code, userId, cart } = req.body;

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
  if (!product) throw new Error(`Product ${item.productId} not found`);
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

/**
 * Get eligible items for coupon
 */
export const getEligibleItems = async (cart, coupon) => {
  // If no specific products or categories, apply to all
  if ((!coupon.applicableProducts || coupon.applicableProducts.length === 0) &&
      (!coupon.applicableCategories || coupon.applicableCategories.length === 0)) {
    return cart;
  }

  // Get product details to check categories
  const productIds = cart.map(item => item.productId);
  const products = await Product.findAll({
    where: { id: { [Op.in]: productIds } },
    attributes: ['id', 'categoryId']
  });

  const productCategoryMap = {};
  products.forEach(product => {
    productCategoryMap[product.id] = product.categoryId;
  });

  // Filter eligible items
  return cart.filter(item => {
    const productId = item.productId;
    const categoryId = productCategoryMap[productId];

    // Check if product is directly applicable
    if (coupon.applicableProducts && coupon.applicableProducts.includes(productId)) {
      return true;
    }

    // Check if category is applicable
    if (coupon.applicableCategories && coupon.applicableCategories.includes(categoryId)) {
      return true;
    }

    return false;
  });
};

/**
 * Validate Coupon - Check if coupon is valid without applying
 * GET /api/coupons/validate/:code
 */
export const validateCoupon = async (req, res) => {
  const { code } = req.params;
  const { userId, orderTotal } = req.query;

  try {
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

    const validity = await coupon.isValid(userId, parseFloat(orderTotal) || 0);

    return res.status(200).json({
      success: true,
      data: {
        valid: validity.valid,
        reason: validity.reason,
        coupon: validity.valid ? {
          id: coupon.id,
          code: coupon.code,
          name: coupon.name,
          description: coupon.description,
          type: coupon.type,
          value: coupon.value,
          minimumAmount: coupon.minimumAmount,
          maxDiscountAmount: coupon.maxDiscountAmount
        } : null
      }
    });

  } catch (error) {
    console.error('Validate coupon error:', error);
    return res.status(500).json({
      success: false,
      message: "Failed to validate coupon"
    });
  }
};

/**
 * Remove Coupon - Remove applied coupon from session
 * DELETE /api/coupons/remove
 */
export const removeCoupon = async (req, res) => {
  try {
    // This is typically handled on frontend by clearing the coupon state
    // But you can implement session-based coupon storage here if needed
    
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

/**
 * Get User Coupons - Get available coupons for user
 * GET /api/coupons/user/:userId
 */
export const getUserCoupons = async (req, res) => {
  const { userId } = req.params;

  try {
    const now = new Date();
    
    // Get all active coupons that user hasn't exceeded usage limit
    const coupons = await Coupon.findAll({
      where: {
        isActive: true,
        [Op.or]: [
          { startDate: null },
          { startDate: { [Op.lte]: now } }
        ],
        [Op.or]: [
          { endDate: null },
          { endDate: { [Op.gte]: now } }
        ],
        [Op.or]: [
          { usageLimit: null },
          { usedCount: { [Op.lt]: { [Op.col]: 'usageLimit' } } }
        ]
      },
      attributes: ['id', 'code', 'name', 'description', 'type', 'value', 'minimumAmount', 'maxDiscountAmount', 'endDate'],
      order: [['createdAt', 'DESC']]
    });

    // Filter out coupons user has already used (if per-user limit exists)
    const availableCoupons = [];
    
    for (const coupon of coupons) {
      if (coupon.usageLimitPerUser) {
        const userUsageCount = await CouponUsage.count({
          where: {
            userId,
            couponId: coupon.id
          }
        });
        
        if (userUsageCount < coupon.usageLimitPerUser) {
          availableCoupons.push(coupon);
        }
      } else {
        availableCoupons.push(coupon);
      }
    }

    return res.status(200).json({
      success: true,
      data: availableCoupons,
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

/**
 * Apply Coupon to Order - Called during order creation
 * This function should be called from your order creation logic
 */
export const applyCouponToOrder = async (orderId, couponId, userId, eligibleItems) => {
  try {
    const coupon = await Coupon.findByPk(couponId);
    if (!coupon) {
      throw new Error('Coupon not found');
    }

    // Create coupon usage records for each eligible product
    const usageRecords = eligibleItems.map(item => ({
      userId,
      couponId,
      productId: item.productId,
      usedAt: new Date()
    }));

    await CouponUsage.bulkCreate(usageRecords, {
      ignoreDuplicates: true // Prevent duplicate usage
    });

    // Update coupon used count
    await coupon.increment('usedCount');

    return {
      success: true,
      message: 'Coupon applied to order successfully'
    };

  } catch (error) {
    console.error('Apply coupon to order error:', error);
    throw error;
  }
};

/**
 * Get Coupon Usage History - Admin endpoint
 * GET /api/admin/coupons/:couponId/usage
 */
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



// Updated Coupon Model with enhanced isValid method
// Add this method to your existing Coupon model

// Enhanced isValid method for Coupon model


// Example usage in Order creation
/*
// In your orderController.js
export const createOrder = async (req, res) => {
  const { userId, items, couponId, shippingAddress, paymentMethod } = req.body;
  
  try {
    const orderTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    let discount = 0;
    let finalAmount = orderTotal;

    // Apply coupon if provided
    if (couponId) {
      const coupon = await Coupon.findByPk(couponId);
      if (coupon) {
        const validity = coupon.isValid(userId, orderTotal);
        if (validity.valid) {
          const eligibleItems = await getEligibleItems(items, coupon);
          const eligibleTotal = eligibleItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
          discount = coupon.calculateDiscount(eligibleTotal);
          finalAmount = orderTotal - discount;
        }
      }
    }

    // Create order
    const order = await Order.create({
      userId,
      items,
      totalAmount: orderTotal,
      discountAmount: discount,
      finalAmount,
      couponId,
      shippingAddress,
      paymentMethod,
      status: 'pending'
    });

    // Apply coupon to order if discount was applied
    if (discount > 0 && couponId) {
      await applyCouponToOrder(order.id, couponId, userId, eligibleItems);
    }

    return res.status(201).json({
      success: true,
      data: order,
      message: 'Order created successfully'
    });

  } catch (error) {
    console.error('Create order error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create order'
    });
  }
};
*/
