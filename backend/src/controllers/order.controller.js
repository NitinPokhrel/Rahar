// controllers/order.controller.js
import { Op, Sequelize } from "sequelize";
import { Order, OrderItem, Product, ProductVariant, Coupon } from "../models/index.model.js";
import { sequelize } from "../models/index.model.js";

export const createOrder = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const userId = req.user.id;
    const {
      items,
      shippingAddressId,
      paymentMethod,
      couponCode,
      notes
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "Order items are required", status: "error" });
    }

    let subtotal = 0;
    for (const item of items) {
      subtotal += parseFloat(item.unitPrice) * item.quantity;
    }

    let discountAmount = 0;
    let couponId = null;

    if (couponCode) {
      const coupon = await Coupon.findOne({
        where: { code: couponCode, isActive: true }
      });

      if (coupon) {
        const validation = coupon.isValid(userId, subtotal);
        if (validation.valid) {
          discountAmount = coupon.calculateDiscount(subtotal);
          couponId = coupon.id;
        } else {
          await transaction.rollback();
          return res.status(400).json({ message: validation.reason, status: "error" });
        }
      }
    }

    const total = subtotal - discountAmount;

    const order = await Order.create({
      userId,
      subtotal,
      discountAmount,
      total,
      shippingAddressId,
      paymentMethod,
      couponId,
      notes,
      status: paymentMethod === "cash_on_delivery" ? "confirmed" : "pending",
      paymentStatus: paymentMethod === "cash_on_delivery" ? "pending" : "pending"
    }, { transaction });

    await Promise.all(items.map(item =>
      OrderItem.create({
        orderId: order.id,
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        unitPrice: item.unitPrice
      }, { transaction })
    ));

    if (couponId) {
      await Coupon.increment('usedCount', { where: { id: couponId }, transaction });
    }

    for (const item of items) {
      if (item.variantId) {
        await ProductVariant.decrement('stockQuantity', {
          by: item.quantity,
          where: { id: item.variantId },
          transaction
        });
      } else {
        await Product.decrement('stockQuantity', {
          by: item.quantity,
          where: { id: item.productId },
          transaction
        });
      }
    }

    await transaction.commit();

    const completeOrder = await Order.findByPk(order.id, {
      include: [
        {
          model: OrderItem,
          as: "items",
          include: [
            { model: Product, as: "product", attributes: ["id", "name", "images"] },
            { model: ProductVariant, as: "variant", attributes: ["id", "name", "attributes"] }
          ]
        }
      ]
    });

    return res.status(201).json({
      message: "Order created successfully",
      status: "success",
      data: completeOrder
    });

  } catch (error) {
    await transaction.rollback();
    console.error("Error creating order:", error);
    res.status(500).json({ message: "Internal Server Error" });
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
      include: [{
        model: OrderItem,
        as: "items",
        include: [
          { model: Product, as: "product", attributes: ["id", "name", "slug", "images"] },
          { model: ProductVariant, as: "variant", attributes: ["id", "name", "attributes"] }
        ]
      }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["createdAt", "DESC"]]
    });

    return res.status(200).json({
      message: "Orders fetched successfully",
      status: "success",
      data: {
        orders: orders.rows,
        pagination: {
          total: orders.count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(orders.count / limit)
        }
      }
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getSingleOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.params;

    const order = await Order.findOne({
      where: { id: orderId, userId },
      include: [
        {
          model: OrderItem,
          as: "items",
          include: [
            { model: Product, as: "product" },
            { model: ProductVariant, as: "variant" }
          ]
        },
        {
          model: Coupon,
          as: "coupon",
          attributes: ["code", "name", "type", "value"]
        }
      ]
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found", status: "error" });
    }

    return res.status(200).json({
      message: "Order details fetched successfully",
      status: "success",
      data: order
    });
  } catch (error) {
    console.error("Error fetching order details:", error);
    res.status(500).json({ message: "Internal Server Error" });
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
        status: { [Op.in]: ["pending", "confirmed"] }
      }
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found or cannot be cancelled", status: "error" });
    }

    await order.update({
      status: "cancelled",
      cancelledAt: new Date(),
      cancellationReason: reason
    });

    return res.status(200).json({
      message: "Order cancelled successfully",
      status: "success",
      data: order
    });
  } catch (error) {
    console.error("Error cancelling order:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
