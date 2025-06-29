// routes/product.routes.js
import { Router } from "express";
import {
  getAllProducts,
  getSingleProduct,
  getFeaturedProducts,
  getRelatedProducts
} from "../controllers/product.controller.js";

const router = Router();

router.route("/").get(getAllProducts);
router.route("/featured/list").get(getFeaturedProducts);
router.route("/:productId/related").get(getRelatedProducts);
router.route("/:slug").get(getSingleProduct);

export default router;
