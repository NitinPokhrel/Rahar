// routes/review.routes.js
import { Router } from "express";
import {
  getProductReviews,
  submitReview,
  getUserReviews
} from "../controllers/review.controller.js";

const router = Router();

router.route("/product/:productId").get(getProductReviews);
router.route("/").post(submitReview);
router.route("/my-reviews").get(getUserReviews);

export default router;
