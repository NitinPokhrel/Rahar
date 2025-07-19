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

function checkAccess(req, res, next) {
  if (
    req.user.role !== "admin" &&
    !req.user.permissions.includes("manageProducts")
  ) {
    return res.status(401).send({
      success: false,
      status: "Access Denied",
      message: "You are not authorized to perform operation on products",
    });
  } else {
    next();
  }
}

// Public routes
router.get("/", getAllProducts);
router.get("/featured", getFeaturedProducts);
router.get("/related/:productId", getRelatedProducts);
router.get("/:id", getProductById);

// **********************************   ------------   *******************************************

// Admin-only routes
router.post("/", upload.any(), checkAccess, createProduct);
router.put("/:id", upload.any(), checkAccess, updateProduct);
router.delete("/:id", checkAccess, deleteProduct);
router.patch("/:id/undo", checkAccess, restoreProduct);

// product variant routes

router.put("/:id/variants", upload.any(), checkAccess, updateProductVariant);
router.delete("/:id/variants", checkAccess, deleteProductVariant);
router.patch("/:id/variants/undo", checkAccess, restoreProductVariant);

export default router;
