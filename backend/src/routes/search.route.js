// routes/search.routes.js
import express from "express";
import {
  searchProducts,
  getProductSearchSuggestions,
  searchUsers,
  searchCoupons,
  searchOrders,
  searchReviews,
} from "../controllers/search.controller.js";
import { adminMiddleware, authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

// Public routes
router.get("/products", searchProducts);
router.get("/products/suggestions", getProductSearchSuggestions);

// Apply admin middleware to all routes below
router.use(authMiddleware)
router.use(adminMiddleware);

// Admin routes
router.get("/users", searchUsers);
router.get("/orders", searchOrders);
router.get("/coupons", searchCoupons);
router.get("/reviews", searchReviews);

export default router;