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
  undoDeleteProductVariant,
  undoDeleteProduct,
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
router.post("/", upload.any(), createProduct);

router.put(
  "/:id",
  upload.any(),
  updateProduct
);
router.delete("/:id", deleteProduct);
router.patch("/:id/undo", undoDeleteProduct);


// product variant routes
// update product variant 
router.put("/:id/variants", upload.any(), updateProductVariant);
// delete product variant
router.delete("/:id/variants", deleteProductVariant);
// undo delete product variant
router.patch("/:id/variants/undo", undoDeleteProductVariant);

export default router;
