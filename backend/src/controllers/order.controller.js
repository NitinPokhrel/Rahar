// controllers/order.controller.js
import { Op } from "sequelize";
import {
  Order,
  OrderItem,
  Product,
  ProductVariant,
  Coupon,
} from "../models/index.model.js";
import { sequelize } from "../models/index.model.js";
import { Cart } from "../models/index.model.js";
import { applyCouponToOrder } from "./coupon.controller.js";


// IMPROVED createOrder function with better error handling
export const createOrder = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const userId = req.user.id;
        const { items, phone, address, paymentMethod, couponCode, notes } = req.body;

        // Validation
        if (!items || items.length === 0) {
            await transaction.rollback();
            return res.status(400).json({ 
                message: "Order items are required", 
                status: "error" 
            });
        }

        if (!phone || !address || !paymentMethod) {
            await transaction.rollback();
            return res.status(400).json({ 
                message: "Phone, address, and payment method are required", 
                status: "error" 
            });
        }

        let products = [];
        let subtotal = 0;

        // Process cart items
        for (const itemId of items) {
            const cartItem = await Cart.findOne({
                where: {
                    id: itemId,
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
                transaction
            });

            if (!cartItem || !cartItem.product) {
                await transaction.rollback();
                throw new Error(`Cart item with ID ${itemId} is invalid or not found`);
            }

            // Check stock availability
            const availableStock = cartItem.variant 
                ? cartItem.variant.stockQuantity 
                : cartItem.product.stockQuantity;

            if (availableStock < cartItem.quantity) {
                await transaction.rollback();
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock for ${cartItem.product.name}. Available: ${availableStock}, Requested: ${cartItem.quantity}`,
                    status: "error"
                });
            }

            products.push({
                productId: cartItem.product.id,
                quantity: cartItem.quantity,
                variant: cartItem.variant
                    ? { id: cartItem.variant.id, price: cartItem.variant.price }
                    : null,
                product: {
                    id: cartItem.product.id,
                    price: cartItem.product.price,
                },
            });

            const itemPrice = parseFloat(
                cartItem.variant ? cartItem.variant.price : cartItem.product.price
            );
            subtotal += itemPrice * cartItem.quantity;
        }

        // Apply coupon if provided
        let couponResult = null;
        let finalTotal = subtotal;

        if (couponCode) {
            console.log(products, "products before coupon");
            couponResult = await applyCouponToOrder(
                couponCode,
                userId,
                products,
                transaction
            );
            console.log(couponResult, "coupon result");

            if (couponResult.success) {
                products = couponResult.updatedProducts;
                finalTotal = subtotal - couponResult.totalDiscountAmount;
            } else {
                // If coupon application fails, we can either:
                // 1. Continue without coupon (current approach)
                // 2. Fail the entire order (uncomment below)
                
                // await transaction.rollback();
                // return res.status(400).json({
                //     success: false,
                //     message: `Coupon error: ${couponResult.failedCoupons[0]?.reason || 'Unknown error'}`,
                //     status: "error"
                // });
            }
        }

        // Create order with applied discounts
        const orderData = {
            userId,
            subtotal,
            discountAmount: couponResult?.totalDiscountAmount || 0,
            total: finalTotal,
            address,
            paymentMethod,
            phone,
            notes,
            status: paymentMethod === "cashOnDelivery" ? "confirmed" : "pending",
            paymentStatus: paymentMethod === "cashOnDelivery" ? "pending" : "paid",
        };

        // Add coupon IDs if any coupons were applied
        if (couponResult?.success && couponResult.appliedCoupons.length > 0) {
            // If your order model supports multiple coupons, store as array
            // Otherwise, store the first one
            orderData.couponId = couponResult.appliedCoupons[0].couponId;
        }

        const order = await Order.create(orderData, { transaction });

        // Create order items with individual discounts
        await Promise.all(
            products.map((item) =>
                OrderItem.create(
                    {
                        orderId: order.id,
                        productId: item.productId,
                        productVarientId: item.variant ? item.variant.id : null,
                        quantity: item.quantity,
                        price: item.variant ? item.variant.price : item.product.price,
                        discountAmount: item.totalCouponDiscount || 0,
                    },
                    { transaction }
                )
            )
        );

        // Update stock quantities
        for (const product of products) {
            if (product.variant) {
                await ProductVariant.decrement("stockQuantity", {
                    by: product.quantity,
                    where: { id: product.variant.id },
                    transaction,
                });
            } else {
                await Product.decrement("stockQuantity", {
                    by: product.quantity,
                    where: { id: product.product.id },
                    transaction,
                });
            }
        }

        // Clear cart items after successful order creation
        // await Promise.all(
        //     items.map(itemId => 
        //         Cart.destroy({
        //             where: {
        //                 id: itemId,
        //                 userId,
        //             },
        //             transaction
        //         })
        //     )
        // );

        await transaction.commit();

        // Fetch complete order details
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
            data: {
                order: completeOrder,
                couponInfo: couponResult ? {
                    appliedCoupons: couponResult.appliedCoupons,
                    failedCoupons: couponResult.failedCoupons,
                    totalDiscountAmount: couponResult.totalDiscountAmount
                } : null
            }
        });
        
    } catch (error) {
        await transaction.rollback();
        console.error("Error creating order:", error);
        res.status(500).json({
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
