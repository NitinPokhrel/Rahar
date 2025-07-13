import { Router } from "express";
import {
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

  getDashboardAnalytics,
} from "../controllers/admin.controller.js";

const router = Router();

// ========== USER MANAGEMENT ==========
router.get("/users", checkAdminPermission(), getAllUsers);

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


// ========== DASHBOARD ANALYTICS ==========
router.get("/analytics/dashboard", checkAdminPermission(), getDashboardAnalytics);

export default router;