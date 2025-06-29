import { Router } from "express";
import {
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
  getDashboardAnalytics,
} from "../controllers/admin.controller.js";

const router = Router();

// ========== USER MANAGEMENT ==========
router.get("/users", checkAdminPermission(), getAllUsers);
router.get("/users/:id", checkAdminPermission(), getUserById);
router.post("/users", checkAdminPermission("addUser"), createNewUser);
router.put("/users/:id", checkAdminPermission("updateUser"), updateUser);
router.delete("/users/:id", checkAdminPermission("removeUser"), deleteUser);

// ========== CATEGORY MANAGEMENT ==========
router.get("/categories", checkAdminPermission(), getCategories);
router.post("/categories", checkAdminPermission("addCategory"), createCategory);
router.put("/categories/:id", checkAdminPermission("updateCategory"), updateCategory);
router.delete("/categories/:id", checkAdminPermission("removeCategory"), deleteCategory);

// ========== PRODUCT MANAGEMENT ==========
router.get("/products", checkAdminPermission(), getAllProducts);
router.get("/products/:id", checkAdminPermission(), getProductById);
router.post("/products", checkAdminPermission("addProduct"), createProduct);
router.put("/products/:id", checkAdminPermission("updateProduct"), updateProduct);
router.delete("/products/:id", checkAdminPermission("removeProduct"), deleteProduct);

// ========== PRODUCT VARIANT MANAGEMENT ==========
router.get("/products/:productId/variants", checkAdminPermission(), getProductVariant);
router.post("/products/:productId/variants", checkAdminPermission("addProduct"), createProductVariant);
router.put("/variants/:id", checkAdminPermission("updateProduct"), updateProductVariant);
router.delete("/variants/:id", checkAdminPermission("removeProduct"), deleteProductVariant);

// ========== ORDER MANAGEMENT ==========
router.get("/orders", checkAdminPermission(), getAllOrderWithFilter);
router.get("/orders/:id", checkAdminPermission(), getOrderById);
router.put("/orders/:id/status", checkAdminPermission("updateOrder"), updateOrderStatus);

// ========== COUPON MANAGEMENT ==========
router.get("/coupons", checkAdminPermission(), getAllCoupon);
router.post("/coupons", checkAdminPermission("addCoupon"), createCoupon);
router.put("/coupons/:id", checkAdminPermission("updateCoupon"), updateCoupon);
router.delete("/coupons/:id", checkAdminPermission("removeCoupon"), deleteCoupon);

// ========== REVIEWS MANAGEMENT ==========
router.get("/reviews", checkAdminPermission(), getAllReviews);
router.delete("/reviews/:id", checkAdminPermission("removeReview"), deleteReview);

// ========== SETTINGS MANAGEMENT ==========
router.get("/settings", checkAdminPermission(), getAllSettings);
router.put("/settings/:key", checkAdminPermission(), updateSetting);

// ========== NEWSLETTER MANAGEMENT ==========
router.get("/newsletter-subscriptions", checkAdminPermission(), getNewsletterSubscription);

// ========== DASHBOARD ANALYTICS ==========
router.get("/analytics/dashboard", checkAdminPermission(), getDashboardAnalytics);

export default router;
