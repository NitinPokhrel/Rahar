// controllers/order.controller.js
import { Op } from "sequelize";
import {
  Order,
  OrderItem,
  Product,
  ProductVariant,
  Coupon,
  CouponUsage,
} from "../models/index.model.js";
import { sequelize } from "../models/index.model.js";
import { Cart } from "../models/index.model.js";

async function getDiscountAmount(couponCode, userId, products, transaction) {
  try {
    const coupon = await Coupon.findOne({
      where: { 
        code: couponCode.toUpperCase(),
        isActive: true 
      },
      transaction
    });

    if (!coupon) {
      throw new Error('Coupon not found or inactive');
    }

    const now = new Date();
    if (coupon.startDate && now < new Date(coupon.startDate)) {
      throw new Error('Coupon is not yet active');
    }
    if (coupon.endDate && now > new Date(coupon.endDate)) {
      throw new Error('Coupon has expired');
    }

    if (coupon.usedCount >= coupon.usageLimit) {
      throw new Error('Coupon usage limit exceeded');
    }

    const userUsageCount = await CouponUsage.count({
      where: { 
        userId, 
        couponId: coupon.id 
      },
      transaction
    });

    if (userUsageCount >= coupon.usageLimitPerUser) {
      throw new Error('User coupon usage limit exceeded');
    }

    let allApplicableProducts = [];
    let subtotal = 0;

    for (const item of products) {
      const price = parseFloat(item.price);
      const stock = parseInt(item.stock);
      const itemTotal = price * stock;
      
      if (coupon.isGlobal || coupon.applicableProducts.includes(item.product)) {
        allApplicableProducts.push({
          ...item,
          price,
          stock,
          itemTotal
        });
      }
      
      subtotal += itemTotal;
    }

    if (allApplicableProducts.length === 0) {
      throw new Error('Coupon is not applicable to any products in cart');
    }

    if (subtotal < coupon.minimumAmount) {
      throw new Error(`Minimum order amount of ${coupon.minimumAmount} not met`);
    }

    let availableProducts = [];
    
    for (const item of allApplicableProducts) {
      const productUsageCount = await CouponUsage.count({
        where: { 
          userId, 
          couponId: coupon.id,
          productId: item.product 
        },
        transaction
      });
      
      if (productUsageCount < coupon.usageLimitPerUser) {
        availableProducts.push(item);
      }
    }

    if (availableProducts.length === 0) {
      throw new Error('Coupon usage limit exceeded for all applicable products');
    }

    const remainingUserUsage = coupon.usageLimitPerUser - userUsageCount;
    const maxProductsToApply = Math.min(remainingUserUsage, availableProducts.length);
    availableProducts.sort((a, b) => b.itemTotal - a.itemTotal);
    const productsToApply = availableProducts.slice(0, maxProductsToApply);

    let discountAmount = 0;
    
    for (const item of productsToApply) {
      let itemDiscount = 0;
      
      if (coupon.type === 'percentage') {
        itemDiscount = (item.itemTotal * coupon.value) / 100;
      } else if (coupon.type === 'fixed') {
        itemDiscount = Math.min(coupon.value, item.itemTotal);
      }
      
      itemDiscount = Math.min(itemDiscount, coupon.maxDiscountAmount);
      discountAmount += itemDiscount;
    }

    const applicableSubtotal = productsToApply.reduce((sum, item) => sum + item.itemTotal, 0);
    discountAmount = Math.min(discountAmount, applicableSubtotal);
    discountAmount = Math.round(discountAmount * 100) / 100;

    const couponUsagePromises = productsToApply.map(item => 
      CouponUsage.create({
        userId,
        couponId: coupon.id,
        productId: item.product,
        usedAt: new Date()
      }, { transaction })
    );

    await Promise.all(couponUsagePromises);

    await coupon.increment('usedCount', { 
      by: productsToApply.length, 
      transaction 
    });

    return {
      amount: discountAmount,
      id: coupon.id,
      couponDetails: {
        code: coupon.code,
        name: coupon.name,
        type: coupon.type,
        value: coupon.value,
        appliedToProducts: productsToApply.map(p => ({
          productId: p.product,
          itemTotal: p.itemTotal,
          discount: coupon.type === 'percentage' 
            ? Math.min((p.itemTotal * coupon.value) / 100, coupon.maxDiscountAmount)
            : Math.min(coupon.value, p.itemTotal, coupon.maxDiscountAmount)
        }))
      }
    };

  } catch (error) {
    console.error('Discount calculation error:', error.message);
    throw error;
  }
}


export const createOrder = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const userId = req.user.id;
    const { items, phone, address, paymentMethod, couponCode, notes } =
      req.body;

    if (!items || items.length === 0) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Order items are required",
          status: "error",
        });
    }

    let products = [];
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

      if (!cartItem.id || !cartItem.product) {
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

      subtotal +=
        parseFloat(
          cartItem.variant ? cartItem.variant.price : cartItem.product.price
        ) * cartItem.quantity;
    }

    let coupenResult;

    console.log(products)

    if (couponCode) {
      coupenResult = await getDiscountAmount(
        couponCode,
        userId,
        products,
        transaction
      );
    }

    const order = await Order.create(
      {
        userId,
        subtotal,
        discountAmount: coupenResult?.amount,
        address,
        paymentMethod,
        couponId: coupenResult?.id,
        phone,
        notes,
        status: paymentMethod === "cashOnDelivery" ? "confirmed" : "pending",
        paymentStatus: paymentMethod === "cashOnDelivery" ? "pending" : "paid",
      },
      { transaction }
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
      req.user.role !== "admin" &&
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
    const userId = req.user.id;

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

    const order = await Order.findOne({
      where: {
        id: orderId,
        userId,
        status: { [Op.in]: ["pending", "confirmed"] },
      },
    });

    if (!order) {
      return res.status(404).json({
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
      message: "Order cancelled successfully",
      status: "success",
      data: order,
    });
  } catch (error) {
    console.error("Error cancelling order:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
