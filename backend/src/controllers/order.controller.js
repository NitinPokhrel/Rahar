// controllers/order.controller.js
import { Op, Sequelize } from "sequelize";
import {
  Order,
  OrderItem,
  Product,
  ProductVariant,
  Coupon,
} from "../models/index.model.js";
import { sequelize } from "../models/index.model.js";
import { Cart } from "../models/index.model.js";

async function getDiscountAmount(a, b, c, d) {
  return 200;
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
        .json({ message: "Order items are required", status: "error" });
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
        price: cartItem.variant ? cartItem.variant.price : cartItem.product.price,
      });

      subtotal +=
        parseFloat(
          cartItem.variant ? cartItem.variant.price : cartItem.product.price
        ) * cartItem.quantity;
    }

    let coupenResult;

    if (couponCode) {
      coupenResult = await getDiscountAmount(
        couponCode,
        userId,
        products,
        transaction
      );
    }

    console.log(      {
        userId,
        subtotal,
        discountAmount: coupenResult?.amount,
        address,
        paymentMethod,
        couponId: coupenResult?.id,
        phone,
        notes,
        status: paymentMethod === "cashOnDelivery" ? "confirmed" : "pending",
        paymentStatus:
          paymentMethod === "cashOnDelivery" ? "pending" : "paid",
      },)

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
        paymentStatus:
          paymentMethod === "cashOnDelivery" ? "pending" : "paid",
      },
      { transaction }
    );

    await Promise.all(
      products.map((item) =>
        OrderItem.create(
          {
            orderId: order.id,
            productId: item.product,
            variantId: item.variant,
            quantity: item.stock,
            unitPrice: item.price,
          },
          { transaction }
        )
      )
    );

    for (const item of items) {
      if (item.variantId) {
        await ProductVariant.decrement("stockQuantity", {
          by: item.quantity,
          where: { id: item.variantId },
          transaction,
        });
      } else {
        await Product.decrement("stockQuantity", {
          by: item.quantity,
          where: { id: item.productId },
          transaction,
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
            {
              model: Product,
              as: "product",
              attributes: ["id", "name", "images"],
            },
            {
              model: ProductVariant,
              as: "variant",
              attributes: ["id", "name", "attributes"],
            },
          ],
        },
      ],
    });

    return res.status(201).json({
      message: "Order created successfully",
      status: "success",
      data: completeOrder,
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error creating order:", error);
    res.status(500).send({
      success: false,
      status: "Order Creation Failed",
      message: error.message
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
              as: "variant",
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
      message: "Orders fetched successfully",
      status: "success",
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
            { model: ProductVariant, as: "variant" },
          ],
        },
        {
          model: Coupon,
          as: "coupon",
          attributes: ["code", "name", "type", "value"],
        },
      ],
    });

    if (!order) {
      return res
        .status(404)
        .json({ message: "Order not found", status: "error" });
    }

    return res.status(200).json({
      message: "Order details fetched successfully",
      status: "success",
      data: order,
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
