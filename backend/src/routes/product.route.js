import express from "express";
import {
  createProduct,
  updateProduct,
  deleteProduct,
  getProductById,
  getAllProducts,
  getFeaturedProducts,
  getRelatedProducts,
  updateProductVariant,
  deleteProductVariant,
  restoreProduct,
  restoreProductVariant,
} from "../controllers/product.controller.js";
import { permissionMiddleware } from "../middleware/auth.middleware.js";
import upload from "../config/multer.js";

const router = express.Router();

// Public routes
router.get("/", getAllProducts);
router.get("/featured", getFeaturedProducts);
router.get("/related/:productId", getRelatedProducts);
router.get("/:id", getProductById);

// Apply admin middleware to all routes below
router.use(permissionMiddleware("manageProducts"));

// Admin-only routes
router.post("/", upload.any(), createProduct);
router.put("/:id", upload.any(), updateProduct);
router.delete("/:id", deleteProduct);
router.patch("/:id/undo", restoreProduct);

// Product variant routes
router.put("/:id/variants", upload.any(), updateProductVariant);
router.delete("/:id/variants", deleteProductVariant);
router.patch("/:id/variants/undo", restoreProductVariant);

export default router;