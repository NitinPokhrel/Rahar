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
import upload from "../config/multer.js";

const router = express.Router();

// Public routes
router.get("/", getAllProducts);
router.get("/featured", getFeaturedProducts);
router.get("/related/:productId", getRelatedProducts);
router.get("/:id", getProductById);

// **********************************   ------------   *******************************************

// Admin-only routes
router.post(
  "/",
  upload.any(),
  permissionMiddleware("manageProducts"),
  createProduct
);

router.put(
  "/:id",
  upload.any(),
  permissionMiddleware("manageProducts"),
  updateProduct
);
router.delete("/:id", permissionMiddleware("manageProducts"), deleteProduct);
router.patch(
  "/:id/undo",
  permissionMiddleware("manageProducts"),
  restoreProduct
);

// product variant routes

router.put(
  "/:id/variants",
  upload.any(),
  permissionMiddleware("manageProducts"),
  updateProductVariant
);
router.delete(
  "/:id/variants",
  permissionMiddleware("manageProducts"),
  deleteProductVariant
);
router.patch(
  "/:id/variants/undo",
  permissionMiddleware("manageProducts"),
  restoreProductVariant
);

export default router;
