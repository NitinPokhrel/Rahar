import { Router } from "express";
import {
  User,
  Product,
  Order,
  OrderItem,
  Coupon,
  Review,
  ProductVariant,
  NewsletterSubscription,
} from "../models/index.model.js";
import { Op } from "sequelize";

const router = Router();

// ==================== USER MANAGEMENT ====================

// Get all users with pagination and filters
// router.get("/users", checkAdminPermission(),
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, role, isActive } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    if (search) {
      where[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (role) where.role = role;
    if (isActive !== undefined) where.isActive = isActive === "true";

    const { count, rows: users } = await User.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [["createdAt", "DESC"]],
      attributes: { exclude: ["password"] },
    });

    return res.status(200).json({
      message: "Users retrieved successfully",
      users,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error("Error retrieving users:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};



// ==================== ORDER MANAGEMENT ====================

const getAllOrderWithFilter = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, paymentStatus, search } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    if (status) where.status = status;
    if (paymentStatus) where.paymentStatus = paymentStatus;
    if (search) where.orderNumber = { [Op.iLike]: `%${search}%` };

    const { count, rows: orders } = await Order.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "firstName", "lastName", "email"],
        },
        {
          model: OrderItem,
          as: "items",
          include: [{ model: Product, as: "product" }],
        },
      ],
      limit: parseInt(limit),
      offset,
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      message: "Orders retrieved successfully",
      orders,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error("Error retrieving orders:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get order by ID
// router.get("/orders/:id", checkAdminPermission(),
const getOrderById = async (req, res) => {
  try {
    const orderId = req.params.id;

    const order = await Order.findByPk(orderId, {
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "firstName", "lastName", "email", "phone"],
        },
        {
          model: OrderItem,
          as: "items",
          include: [
            { model: Product, as: "product" },
            { model: ProductVariant, as: "variant" },
          ],
        },
        { model: Coupon, as: "coupon" },
      ],
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    return res.status(200).json({
      message: "Order retrieved successfully",
      order,
    });
  } catch (error) {
    console.error("Error retrieving order:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Update order status
// router.put(
//   "/orders/:id/status",
//   checkAdminPermission("updateOrder"),
const updateOrderStatus = async (req, res) => {
  try {
    const orderId = req.params.id;
    const { status, notes } = req.body;

    const updateData = { status };

    // Set timestamps based on status
    if (status === "shipped") updateData.shippedAt = new Date();
    if (status === "delivered") updateData.deliveredAt = new Date();
    if (status === "cancelled") {
      updateData.cancelledAt = new Date();
      updateData.cancellationReason = notes;
    }

    const [updatedRows] = await Order.update(updateData, {
      where: { id: orderId },
    });

    if (updatedRows === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    const updatedOrder = await Order.findByPk(orderId);

    return res.status(200).json({
      message: "Order status updated successfully",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};
// ==================== COUPON MANAGEMENT ====================

// Get all coupons
// router.get("/coupons", checkAdminPermission(),
const getAllCoupon = async (req, res) => {
  try {
    const coupons = await Coupon.findAll({
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      message: "Coupons retrieved successfully",
      coupons,
    });
  } catch (error) {
    console.error("Error retrieving coupons:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Create coupon
// router.post("/coupons", checkAdminPermission(),
const createCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.create(req.body);

    return res.status(201).json({
      message: "Coupon created successfully",
      coupon,
    });
  } catch (error) {
    console.error("Error creating coupon:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Update coupon
// router.put("/coupons/:id", checkAdminPermission(),
const updateCoupon = async (req, res) => {
  try {
    const couponId = req.params.id;

    const [updatedRows] = await Coupon.update(req.body, {
      where: { id: couponId },
    });

    if (updatedRows === 0) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    const updatedCoupon = await Coupon.findByPk(couponId);

    return res.status(200).json({
      message: "Coupon updated successfully",
      coupon: updatedCoupon,
    });
  } catch (error) {
    console.error("Error updating coupon:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Delete coupon
// router.delete("/coupons/:id", checkAdminPermission(),
const deleteCoupon = async (req, res) => {
  try {
    const couponId = req.params.id;

    const coupon = await Coupon.findByPk(couponId);
    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    await coupon.destroy();

    return res.status(200).json({
      message: "Coupon deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting coupon:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// ==================== REVIEWS MANAGEMENT ====================

// Get all reviews with filters
// router.get("/reviews", checkAdminPermission(),
const getAllReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10, productId } = req.query;
    const offset = (page - 1) * limit;
    const where = {};

    if (productId) where.productId = productId;

    const { count, rows: reviews } = await Review.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "firstName", "lastName"],
        },
        { model: Product, as: "product", attributes: ["id", "name"] },
      ],
      limit: parseInt(limit),
      offset,
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      message: "Reviews retrieved successfully",
      reviews,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error("Error retrieving reviews:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Delete review
// router.delete("/reviews/:id", checkAdminPermission(),
const deleteReview = async (req, res) => {
  try {
    const reviewId = req.params.id;

    const review = await Review.findByPk(reviewId);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    await review.destroy();

    return res.status(200).json({
      message: "Review deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// ==================== NEWSLETTER MANAGEMENT ====================

// Get newsletter subscriptions
// router.get(
//   "/newsletter-subscriptions",
//   checkAdminPermission(),
const getNewsletterSubscription = async (req, res) => {
  try {
    const { page = 1, limit = 10, isActive } = req.query;
    const offset = (page - 1) * limit;
    const where = {};

    if (isActive !== undefined) where.isActive = isActive === "true";

    const { count, rows: subscriptions } =
      await NewsletterSubscription.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset,
        order: [["createdAt", "DESC"]],
      });

    return res.status(200).json({
      message: "Newsletter subscriptions retrieved successfully",
      subscriptions,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error("Error retrieving subscriptions:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};
// ==================== DASHBOARD ANALYTICS ====================

// Get dashboard analytics
// router.get("/analytics/dashboard", checkAdminPermission(),
const getDashboardAnalytics = async (req, res) => {
  try {
    const [
      totalUsers,
      totalOrders,
      totalProducts,
      totalRevenue,
      pendingOrders,
      lowStockProducts,
    ] = await Promise.all([
      User.count({ where: { role: "customer" } }),
      Order.count(),
      Product.count(),
      Order.sum("subtotal", { where: { status: "delivered" } }) || 0,
      Order.count({ where: { status: "pending" } }),
      Product.count({
        where: {
          stockQuantity: {
            [Op.lte]: Product.sequelize.col("lowStockThreshold"),
          },
        },
      }),
    ]);

    return res.status(200).json({
      message: "Dashboard analytics retrieved successfully",
      analytics: {
        totalUsers,
        totalOrders,
        totalProducts,
        totalRevenue: parseFloat(totalRevenue),
        pendingOrders,
        lowStockProducts,
      },
    });
  } catch (error) {
    console.error("Error retrieving analytics:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Middleware to check admin permissions
const checkAdminPermission = (permission) => {
  return (req, res, next) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    if (permission && !user.permissions.includes(permission)) {
      return res.status(403).json({
        message: `Permission '${permission}' required`,
      });
    }

    next();
  };
};

export {
  checkAdminPermission,
  getAllUsers,
  getAllOrderWithFilter,
  getOrderById,
  updateOrderStatus,
  getAllCoupon,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  getAllReviews,
  deleteReview,
  getNewsletterSubscription,
  getDashboardAnalytics,
};
