// routes/review.routes.js
import { Router } from "express";
import {

  createReview,
  deleteReview,
  getProductStats,
  getReviewById,
  getReviews,
  getUserReviews,
  moderateReview,
  updateReview
} from "../controllers/review.controller.js";

const router = Router();

// ✅ Create a new review (only logged-in users)
router.post('/', createReview);
router.get('/product/:productId/stats', getProductStats);
router.put('/:id', updateReview);
router.delete('/:id', deleteReview);
router.get('/:id', getReviewById);
router.get('/user/:userId', getUserReviews);



// admin

router.get('/', getReviews);
router.patch('/:id/moderate',  moderateReview);

export default router;
