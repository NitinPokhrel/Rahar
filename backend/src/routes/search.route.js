// routes/search.routes.js
import express from "express";
import { searchProducts, getProductSearchSuggestions, searchUsers, searchCoupons, searchOrders, searchReviews } from "../controllers/search.controller.js";

const router = express.Router();


router.get("/products", searchProducts);
router.get("/products/suggestions", getProductSearchSuggestions);

router.get("/users", searchUsers);
router.get("/orders", searchOrders);
router.get("/coupons", searchCoupons);
router.get("/reviews", searchReviews);

export default router;
