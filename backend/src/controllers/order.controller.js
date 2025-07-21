import { Op } from "sequelize";
import {
  Order,
  OrderItem,
  Product,
  ProductVariant,
  Coupon,
  OrderCoupon,
} from "../models/index.model.js";
import { sequelize } from "../models/index.model.js";
import { Cart } from "../models/index.model.js";
import { applyCouponToOrder } from "./coupon.controller.js";

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
      coupenResult = await applyCouponToOrder(
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
