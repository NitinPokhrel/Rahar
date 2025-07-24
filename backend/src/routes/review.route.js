// routes/review.routes.js
import { Router } from "express";
import {
  createReview,
  deleteReview,
  deleteReviewByAdmin,
  getProductStats,
  getReviewById,
  getReviews,
  getUserReviews,
  updateReview,
} from "../controllers/review.controller.js";

const router = Router();

// public routes
router.post("/", createReview);
router.get("/product/:productId/stats", getProductStats);
router.put("/:id", updateReview);
router.delete("/:id", deleteReview);
router.get("/:id", getReviewById);
router.get("/user/:userId", getUserReviews);

// admin

router.get("/", getReviews);
router.delete("/:id/admin", deleteReviewByAdmin);

export default router;
