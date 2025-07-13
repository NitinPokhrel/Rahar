import { Router } from "express";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryBySlug,
  restoreCategory,
} from "../controllers/category.controller.js";
import upload from "../config/multer.js";

const router = Router();

router.get("/", getCategories);
router.get("/:slug", getCategoryBySlug);

// **********************************   ------------   *******************************************

// Admin-only routes
router.post(
  "/",
  upload.fields([{ name: "image", maxCount: 1 }]),
  createCategory
);

router.put(
  "/:id",
  upload.fields([{ name: "image", maxCount: 1 }]),
  updateCategory
);
router.delete("/:id", deleteCategory);
router.patch("/:id/restore", restoreCategory);

export default router;
