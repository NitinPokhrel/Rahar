// routes/search.routes.js
import express from "express";
import { searchProducts, getProductSearchSuggestions, searchUsers } from "../controllers/search.controller.js";

const router = express.Router();


router.get("/products", searchProducts);
router.get("/products/suggestions", getProductSearchSuggestions);

router.get("/users", searchUsers);

export default router;
