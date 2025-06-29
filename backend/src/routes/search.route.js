// routes/search.routes.js
import { Router } from "express";
import {
  searchProducts,
  getSearchSuggestions,
} from "../controllers/search.controller.js";

const router = Router();

router.route("/").get(searchProducts);
router.route("/suggestions").get(getSearchSuggestions);

export default router;
