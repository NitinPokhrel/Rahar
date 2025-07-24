// routes/user.routes.js
import { Router } from "express";
import {
  blockUser,
  createUser,
  getUserProfile,
  unblockUser,
  updateUserAvatar,
  updateUserPermissions,
  updateUserProfile,
} from "../controllers/user.controller.js";
import { permissionMiddleware } from "../middleware/auth.middleware.js";
import upload from "../config/multer.js";

const router = Router();

// Public routes (no auth required)
router.get("/", getUserProfile);
router.patch("/", updateUserProfile);

// Auth required routes
router.patch("/:userId/updateAvatar", 
  upload.fields([{ name: "avatar", maxCount: 1 }]), 
  updateUserAvatar
);

// Apply permission middleware to all routes below
router.use(permissionMiddleware("manageUsers"));

// Admin routes
router.post("/create", 
  upload.fields([{ name: "avatar", maxCount: 1 }]), 
  createUser
);
router.get("/:userId", getUserProfile);
router.patch("/:userId", 
  upload.fields([{ name: "avatar", maxCount: 1 }]), 
  updateUserProfile
);
router.delete("/:userId", blockUser);
router.patch("/:userId/updatePermissions", updateUserPermissions);
router.get("/:userId/unblock", unblockUser);

export default router;