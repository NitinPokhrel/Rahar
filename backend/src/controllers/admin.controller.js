import { Router } from "express";
import {
  User,
  Product,
  Category,
  Order,
  OrderItem,
  Coupon,
  Review,
  ProductVariant,
  Setting,
  NewsletterSubscription,
} from "../models/index.model.js";
import { Op } from "sequelize";

const router = Router();

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

// ==================== USER MANAGEMENT ====================

// Get all users with pagination and filters
// router.get("/users", checkAdminPermission(),
const getAllUsers =  async (req, res) => {
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

// Get user by ID
// router.get("/users/:id", 
  
  const getUserById =   async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findByPk(userId, {
      attributes: { exclude: ["password"] },
      include: [
        { model: Order, as: "orders" },
        { model: Review, as: "reviews" },
      ],
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "User retrieved successfully",
      user,
    });
  } catch (error) {
    console.error("Error retrieving user:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Create new user
// router.post("/users",
   const createNewUser =  async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      dateOfBirth,
      gender,
      role,
      permissions,
      isActive,
    } = req.body;

    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      phone,
      dateOfBirth,
      gender,
      role: role || "customer",
      permissions: permissions || [],
      isActive: isActive !== undefined ? isActive : true,
    });

    const userResponse = user.toJSON();
    delete userResponse.password;

    return res.status(201).json({
      message: "User created successfully",
      user: userResponse,
    });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Update user
// router.put("/users/:id", 
  const updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const updateData = req.body;

    // Remove password from update if present (should be handled separately)
    delete updateData.password;

    const [updatedRows] = await User.update(updateData, {
      where: { id: userId },
    });

    if (updatedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const updatedUser = await User.findByPk(userId, {
      attributes: { exclude: ["password"] },
    });

    return res.status(200).json({
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Delete user (soft delete)
// router.delete(
  // "/users/:id",
  // checkAdminPermission("removeUser"),
  const deleteUser = async (req, res) => {
    try {
      const userId = req.params.id;

      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      await user.destroy(); // Soft delete due to paranoid: true

      return res.status(200).json({
        message: "User deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({
        message: "Internal server error",
        error: error.message,
      });
    }
  }
;

// ==================== CATEGORY MANAGEMENT ====================

// Get all categories
// router.get("/categories"
  const getCategories = async (req, res) => {
  try {
    const categories = await Category.findAll({
      include: [
        { model: Category, as: "parent" },
        { model: Category, as: "children" },
      ],
      order: [["name", "ASC"]],
    });

    return res.status(200).json({
      message: "Categories retrieved successfully",
      categories,
    });
  } catch (error) {
    console.error("Error retrieving categories:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Create category
// router.post("/categories", checkAdminPermission(),
 const createCategory = async (req, res) => {
  try {
    const category = await Category.create(req.body);

    return res.status(201).json({
      message: "Category created successfully",
      category,
    });
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Update category
// router.put("/categories/:id", checkAdminPermission(), 
const updateCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;

    const [updatedRows] = await Category.update(req.body, {
      where: { id: categoryId },
    });

    if (updatedRows === 0) {
      return res.status(404).json({ message: "Category not found" });
    }

    const updatedCategory = await Category.findByPk(categoryId);

    return res.status(200).json({
      message: "Category updated successfully",
      category: updatedCategory,
    });
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Delete category
// router.delete("/categories/:id", checkAdminPermission(),
const deleteCategory =  async (req, res) => {
  try {
    const categoryId = req.params.id;

    const category = await Category.findByPk(categoryId);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    await category.destroy();

    return res.status(200).json({
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// ==================== PRODUCT MANAGEMENT ====================

// Get all products with filters
// router.get("/products", checkAdminPermission(), 
const getAllProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      categoryId,
      isActive,
      isFeatured,
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { sku: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (categoryId) where.categoryId = categoryId;
    if (isActive !== undefined) where.isActive = isActive === "true";
    if (isFeatured !== undefined) where.isFeatured = isFeatured === "true";

    const { count, rows: products } = await Product.findAndCountAll({
      where,
      include: [
        { model: Category, as: "category" },
        { model: ProductVariant, as: "variants" },
      ],
      limit: parseInt(limit),
      offset,
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      message: "Products retrieved successfully",
      products,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error("Error retrieving products:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get product by ID
// router.get("/products/:id", checkAdminPermission(), 
const getProductById = async (req, res) => {
  try {
    const productId = req.params.id;

    const product = await Product.findByPk(productId, {
      include: [
        { model: Category, as: "category" },
        { model: ProductVariant, as: "variants" },
        {
          model: Review,
          as: "reviews",
          include: [{ model: User, as: "user" }],
        },
      ],
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.status(200).json({
      message: "Product retrieved successfully",
      product,
    });
  } catch (error) {
    console.error("Error retrieving product:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Create product
// router.post(
//   "/products",
//   checkAdminPermission("addProduct"),
  const createProduct = async (req, res) => {
    try {
      const product = await Product.create(req.body);

      return res.status(201).json({
        message: "Product created successfully",
        product,
      });
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(500).json({
        message: "Internal server error",
        error: error.message,
      });
    }
  }
;

// Update product
// router.put(
//   "/products/:id",
//   checkAdminPermission("updateProduct"),
  const updateProduct = async (req, res) => {
    try {
      const productId = req.params.id;

      const [updatedRows] = await Product.update(req.body, {
        where: { id: productId },
      });

      if (updatedRows === 0) {
        return res.status(404).json({ message: "Product not found" });
      }

      const updatedProduct = await Product.findByPk(productId, {
        include: [{ model: Category, as: "category" }],
      });

      return res.status(200).json({
        message: "Product updated successfully",
        product: updatedProduct,
      });
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({
        message: "Internal server error",
        error: error.message,
      });
    }
  }
;

// Delete product
// router.delete(
//   "/products/:id",
//   checkAdminPermission("removeProduct"),
  const deleteProduct = async (req, res) => {
    try {
      const productId = req.params.id;

      const product = await Product.findByPk(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      await product.destroy();

      return res.status(200).json({
        message: "Product deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({
        message: "Internal server error",
        error: error.message,
      });
    }
  }
;

// ==================== PRODUCT VARIANT MANAGEMENT ====================

// Get variants for a product
// router.get(
//   "/products/:productId/variants",
//   checkAdminPermission(),
  const getProductVariant = async (req, res) => {
    try {
      const { productId } = req.params;

      const variants = await ProductVariant.findAll({
        where: { productId },
        order: [["name", "ASC"]],
      });

      return res.status(200).json({
        message: "Product variants retrieved successfully",
        variants,
      });
    } catch (error) {
      console.error("Error retrieving variants:", error);
      res.status(500).json({
        message: "Internal server error",
        error: error.message,
      });
    }
  }
;

// Create product variant
// router.post(
//   "/products/:productId/variants",
//   checkAdminPermission("addProduct"),
  const createProductVariant = async (req, res) => {
    try {
      const { productId } = req.params;

      const variant = await ProductVariant.create({
        ...req.body,
        productId,
      });

      return res.status(201).json({
        message: "Product variant created successfully",
        variant,
      });
    } catch (error) {
      console.error("Error creating variant:", error);
      res.status(500).json({
        message: "Internal server error",
        error: error.message,
      });
    }
  }
;

// Update product variant
// router.put(
//   "/variants/:id",
//   checkAdminPermission("updateProduct"),
  const updateProductVariant = async (req, res) => {
    try {
      const variantId = req.params.id;

      const [updatedRows] = await ProductVariant.update(req.body, {
        where: { id: variantId },
      });

      if (updatedRows === 0) {
        return res.status(404).json({ message: "Variant not found" });
      }

      const updatedVariant = await ProductVariant.findByPk(variantId);

      return res.status(200).json({
        message: "Variant updated successfully",
        variant: updatedVariant,
      });
    } catch (error) {
      console.error("Error updating variant:", error);
      res.status(500).json({
        message: "Internal server error",
        error: error.message,
      });
    }
  }
;

// Delete product variant
// router.delete(
//   "/variants/:id",
//   checkAdminPermission("removeProduct"),
  const deleteProductVariant = async (req, res) => {
    try {
      const variantId = req.params.id;

      const variant = await ProductVariant.findByPk(variantId);
      if (!variant) {
        return res.status(404).json({ message: "Variant not found" });
      }

      await variant.destroy();

      return res.status(200).json({
        message: "Variant deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting variant:", error);
      res.status(500).json({
        message: "Internal server error",
        error: error.message,
      });
    }
  }
;

// ==================== ORDER MANAGEMENT ====================

// Get all orders with filters
// router.get("/orders", checkAdminPermission(),
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
  }
;

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

// ==================== SETTINGS MANAGEMENT ====================

// Get all settings
// router.get("/settings", checkAdminPermission(), 
const getAllSettings = async (req, res) => {
  try {
    const settings = await Setting.findAll({
      order: [["key", "ASC"]],
    });

    return res.status(200).json({
      message: "Settings retrieved successfully",
      settings,
    });
  } catch (error) {
    console.error("Error retrieving settings:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Update setting
// router.put("/settings/:key", checkAdminPermission(), 
const updateSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    const [setting, created] = await Setting.findOrCreate({
      where: { key },
      defaults: { key, value },
    });

    if (!created) {
      await setting.update({ value });
    }

    return res.status(200).json({
      message: created
        ? "Setting created successfully"
        : "Setting updated successfully",
      setting,
    });
  } catch (error) {
    console.error("Error updating setting:", error);
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
  }
;

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

export {
  checkAdminPermission,
  getAllUsers,
  getUserById,
  createNewUser,
  updateUser,
  deleteUser,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductVariant,
  createProductVariant,
  updateProductVariant,
  deleteProductVariant,
  getAllOrderWithFilter,
  getOrderById,
  updateOrderStatus,
  getAllCoupon,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  getAllReviews,
  deleteReview,
  getAllSettings,
  updateSetting,
  getNewsletterSubscription,
  getDashboardAnalytics
}
;