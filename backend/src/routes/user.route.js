// routes/user.routes.js
import { Router } from "express";
import {
  createUser,
  getUserProfile,
  updateUserAvatar,
  updateUserPermissions,
  updateUserProfile,
} from "../controllers/user.controller.js";
import {
  authMiddleware,
  permissionMiddleware,
} from "../middleware/auth.middleware.js";
import upload from "../config/multer.js";

const router = Router();

// Public routes (no auth required)
router.get("/", getUserProfile);
router.patch("/", updateUserProfile);

router.use(authMiddleware);

// Auth required routes
router.patch(
  "/:userId/updateAvatar",
  upload.fields([{ name: "avatar", maxCount: 1 }]),
  updateUserAvatar
);

// Apply permission middleware to all routes below
router.use(permissionMiddleware("manageUsers"));

// Admin routes
router.post(
  "/create",
  upload.fields([{ name: "avatar", maxCount: 1 }]),
  createUser
);
router.get("/:userId", getUserProfile);
router.patch(
  "/:userId",
  upload.fields([{ name: "avatar", maxCount: 1 }]),
  updateUserProfile
);

router.patch("/:userId/updatePermissions", updateUserPermissions);

export default router;
