import { Router } from "express";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryBySlug,
  restoreCategory,
} from "../controllers/category.controller.js";
import { authMiddleware, permissionMiddleware } from "../middleware/auth.middleware.js";
import upload from "../config/multer.js";

const router = Router();

// Public routes
router.get("/", getCategories);
router.get("/:slug", getCategoryBySlug);

// Apply auth middleware to all routes below
router.use(authMiddleware);

// Apply admin middleware to all routes below
router.use(permissionMiddleware("manageCategories"));

// Admin-only routes
router.post("/", upload.fields([{ name: "image", maxCount: 1 }]), createCategory);
router.put("/:id", upload.fields([{ name: "image", maxCount: 1 }]), updateCategory);
router.delete("/:id", deleteCategory);
router.patch("/:id/restore", restoreCategory);

export default router;