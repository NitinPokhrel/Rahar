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
import { adminMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/products", searchProducts);
router.get("/products/suggestions", getProductSearchSuggestions);

router.get("/users", adminMiddleware, searchUsers);
router.get("/orders", adminMiddleware, searchOrders);
router.get("/coupons", adminMiddleware, searchCoupons);
router.get("/reviews", adminMiddleware, searchReviews);

export default router;
