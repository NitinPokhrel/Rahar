// controllers/order.controller.js
import { Op } from "sequelize";
import {
  Order,
  OrderItem,
  Product,
  ProductVariant,
  Coupon,
  CouponUsage,
  OrderCoupon,
} from "../models/index.model.js";
import { sequelize } from "../models/index.model.js";
import { Cart } from "../models/index.model.js";

async function getDiscountAmount(couponCodes, userId, products, transaction) {
  try {
    // Validate input
    if (!Array.isArray(couponCodes) || couponCodes.length === 0) {
      throw new Error("At least one coupon code is required");
    }

    // Remove duplicates and convert to uppercase
    const uniqueCouponCodes = [
      ...new Set(couponCodes.map((code) => code.toUpperCase())),
    ];

    // Fetch all coupons
    const coupons = await Coupon.findAll({
      where: {
        code: uniqueCouponCodes,
        isActive: true,
      },
      transaction,
    });

    if (coupons.length === 0) {
      throw new Error("No valid coupons found");
    }

    // Check for any missing coupons
    const foundCouponCodes = coupons.map((c) => c.code);
    const missingCoupons = uniqueCouponCodes.filter(
      (code) => !foundCouponCodes.includes(code)
    );
    if (missingCoupons.length > 0) {
      throw new Error(
        `Coupons not found or inactive: ${missingCoupons.join(", ")}`
      );
    }

    const now = new Date();
    let totalDiscountAmount = 0;
    let appliedCoupons = [];
    let remainingProducts = [...products];

    // Calculate subtotal
    let subtotal = 0;
    for (const item of products) {
      const price = parseFloat(item.price);
      const stock = parseInt(item.stock);
      subtotal += price * stock;
    }

    // Process each coupon
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

        // User usage validation
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

        // Check product-specific usage limits
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

        // Calculate discount for this coupon
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

        // Record coupon usage
        const couponUsagePromises = productsToApply.map((item) =>
          CouponUsage.create(
            {
              userId,
              couponId: coupon.id,
              productId: item.product,
              usedAt: new Date(),
            },
            { transaction }
          )
        );

        await Promise.all(couponUsagePromises);

        // Update coupon used count
        await coupon.increment("usedCount", {
          by: productsToApply.length,
          transaction,
        });

        // Add to results
        totalDiscountAmount += couponDiscountAmount;
        appliedCoupons.push({
          id: coupon.id,
          code: coupon.code,
          name: coupon.name,
          type: coupon.type,
          value: coupon.value,
          discountAmount: couponDiscountAmount,
          appliedToProducts: appliedProducts,
        });

        // Remove applied products from remaining products for next coupon
        const appliedProductIds = productsToApply.map((p) => p.product);
        remainingProducts = remainingProducts.filter(
          (item) => !appliedProductIds.includes(item.product)
        );
      } catch (couponError) {
        console.warn(`Skipping coupon ${coupon.code}:`, couponError.message);
        // Continue with next coupon instead of failing entirely
        continue;
      }
    }

    // Check if any coupons were successfully applied
    if (appliedCoupons.length === 0) {
      throw new Error("No coupons could be applied");
    }

    totalDiscountAmount = Math.round(totalDiscountAmount * 100) / 100;

    return {
      totalAmount: totalDiscountAmount,
      appliedCoupons: appliedCoupons,
      summary: {
        totalCouponsApplied: appliedCoupons.length,
        totalCouponsProvided: uniqueCouponCodes.length,
        totalDiscount: totalDiscountAmount,
      },
    };
  } catch (error) {
    console.error(
      "Multiple coupons discount calculation error:",
      error.message
    );
    throw error;
  }
}

export const createOrder = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const userId = req.user.id;
    const { items, phone, address, paymentMethod, couponCodes, notes } =
      req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order items are required",
        status: "error",
      });
    }

    let products = [];
    let productsForDiscount = [];
    let subtotal = 0;

    for (const item of items) {
      const cartItem = await Cart.findOne({
        where: {
          id: item,
          userId: userId,
        },
        include: [
          {
            association: "product",
          },
          {
            association: "variant",
          },
        ],
      });

      if (!cartItem || !cartItem.id || !cartItem.product) {
        throw new Error("Cart item is invalid !!");
      }

      products.push({
        product: cartItem.product.id,
        variant: cartItem.variant ? cartItem.variant.id : null,
        stock: cartItem.quantity,
        price: cartItem.variant
          ? cartItem.variant.price
          : cartItem.product.price,
      });

      productsForDiscount.push({
        productId: cartItem.product.id,
        product: cartItem.product,
        variant: cartItem.variant,
        quantity: cartItem.quantity,
      });

      subtotal +=
        parseFloat(
          cartItem.variant ? cartItem.variant.price : cartItem.product.price
        ) * cartItem.quantity;
    }

    let coupenResult;

    if (couponCodes && couponCodes.length > 0) {
      coupenResult = await getDiscountAmount(
        couponCodes,
        userId,
        productsForDiscount,
        transaction
      );
    }

    const order = await Order.create(
      {
        userId,
        subtotal,
        discountAmount: coupenResult?.totalDiscountAmount,
        address,
        paymentMethod,
        phone,
        notes,
        status: paymentMethod === "cashOnDelivery" ? "confirmed" : "pending",
        paymentStatus: paymentMethod === "cashOnDelivery" ? "pending" : "paid",
      },
      { transaction }
    );

    await Promise.all(
      coupenResult.appliedCoupons.map((item) =>
        OrderCoupon.create(
          {
            orderId: order.id,
            couponId: item,
          },
          { transaction }
        )
      )
    );

    await Promise.all(
      products.map((item) =>
        OrderItem.create(
          {
            orderId: order.id,
            productId: item.product,
            productVarientId: item.variant,
            quantity: item.stock,
            price: item.price,
          },
          { transaction }
        )
      )
    );

    for (const product of products) {
      // console.log(product)

      if (product.variant) {
        await ProductVariant.decrement("stockQuantity", {
          by: product.stock,
          where: { id: product.variant },
          transaction,
        });
      } else {
        await Product.decrement("stockQuantity", {
          by: product.stock,
          where: { id: product.product },
          transaction,
        });
      }
    }

    for (const item of items) {
      await Cart.destroy({
        where: {
          id: item,
          userId,
        },
      });
    }

    await transaction.commit();

    const completeOrder = await Order.findOne({
      where: {
        id: order.id,
        userId,
      },
      include: [
        {
          model: OrderItem,
          as: "items",
          include: [
            {
              model: Product,
              as: "product",
              attributes: ["id", "name", "images"],
            },
            {
              model: ProductVariant,
              as: "productVarient",
              attributes: ["id", "name", "attributes"],
            },
          ],
        },
      ],
    });

    return res.status(201).json({
      success: true,
      status: "Order Created",
      message: "Order created successfully",
      data: completeOrder,
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error creating order:", error);
    res.status(500).send({
      success: false,
      status: "Order Creation Failed",
      message: error.message,
    });
  }
};

export const getSingleOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.params;

    let order;

    if (
      req.user.role !== "admin" ||
      !req.user.permissions.includes("manageOrders")
    ) {
      order = await Order.findOne({
        where: { id: orderId, userId },
        include: [
          {
            model: OrderItem,
            as: "items",
            include: [
              { model: Product, as: "product" },
              { model: ProductVariant, as: "productVarient" }, // Fixed: matches the alias in OrderItem model
            ],
          },
          {
            model: Coupon,
            as: "coupon",
            attributes: ["code", "name", "type", "value"],
          },
        ],
      });
    } else {
      order = await Order.findOne({
        where: { id: orderId },
        include: [
          {
            model: OrderItem,
            as: "items",
            include: [
              { model: Product, as: "product" },
              { model: ProductVariant, as: "productVarient" },
            ],
          },
          {
            model: Coupon,
            as: "coupon",
          },
        ],
      });
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
        status: "Not Found",
      });
    }

    return res.status(200).json({
      success: true,
      status: "Order Fetched",
      message: "Order details fetched successfully",
      data: order,
    });
  } catch (error) {
    console.error("Error fetching order details:", error);
    res.status(500).json({
      success: false,
      status: "Get Order Failed ",
      message: error.message,
    });
  }
};

export const getUserOrders = async (req, res) => {
  try {
    let userId;
    if (
      req.user.role !== "admin" ||
      !req.user.permissions.includes("manageOrders")
    ) {
      userId = req.user.id;
    } else {
      userId = req.query.userId;
    }

    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = { userId };
    if (status) whereClause.status = status;

    const orders = await Order.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: OrderItem,
          as: "items",
          include: [
            {
              model: Product,
              as: "product",
              attributes: ["id", "name", "slug", "images"],
            },
            {
              model: ProductVariant,
              as: "productVarient", // Fixed: matches the alias in OrderItem model
              attributes: ["id", "name", "attributes"],
            },
          ],
        },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      message: "Orders fetched successfully",
      status: "Order Fetched",
      data: {
        orders: orders.rows,
        pagination: {
          total: orders.count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(orders.count / limit),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({
      success: false,
      status: "Orders failed to get",
      message: error.message,
    });
  }
};

export const cancelOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.params;
    const { reason } = req.body;

    let order;

    if (
      req.user.role !== "admin" ||
      !req.user.permissions.includes("manageOrders")
    ) {
      order = await Order.findOne({
        where: {
          id: orderId,
          userId,
          status: { [Op.in]: ["pending", "confirmed"] },
        },
      });
    } else {
      order = await Order.findOne({
        where: {
          id: orderId,
          status: {
            [Op.in]: ["pending", "confirmed", "processing", "shipped"],
          },
        },
      });
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found or cannot be cancelled",
        status: "error",
      });
    }

    await order.update({
      status: "cancelled",
      cancelledAt: new Date(),
      cancellationReason: reason,
    });

    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      status: "Order Cancelled",
      data: order,
    });
  } catch (error) {
    console.error("Error cancelling order:", error);
    res.status(500).json({
      success: false,
      status: "Order Cancellation Failed",
      message: error.message || "Internal Server Error",
    });
  }
};

export const changeOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const allowedStatuses = [
      "pending",
      "confirmed",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
      "refunded",
    ];

    if (
      req.user.role !== "admin" ||
      !req.user.permissions.includes("manageOrders")
    ) {
      return res.status(401).json({
        success: false,
        status: "Unauthorized",
        message: "You are not allowed to change order status",
      });
    }

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        status: "Invalid Status",
        message: `Status must be one of: ${allowedStatuses.join(", ")}`,
      });
    }

    const order = await Order.findOne({ where: { id: orderId } });

    if (!order) {
      return res.status(404).json({
        success: false,
        status: "Not Found",
        message: "Order not found",
      });
    }

    // Update timestamps conditionally
    switch (status) {
      case "shipped":
        order.shippedAt = new Date();
        break;
      case "delivered":
        order.deliveredAt = new Date();
        break;
      case "cancelled":
        order.cancelledAt = new Date();
        break;
    }

    order.status = status;
    await order.save();

    return res.status(200).json({
      success: true,
      status: "Successful",
      message: `Order status changed to '${status}'`,
      data: order,
    });
  } catch (error) {
    console.error("Error changing order status:", error);
    return res.status(500).json({
      success: false,
      status: "Order status failed to update",
      message: error.message || "Internal Server Error",
    });
  }
};
