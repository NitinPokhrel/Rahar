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
import upload from "../config/multer.js";

const router = Router();

router.route("/").get(getUserProfile).patch(updateUserProfile);

router
  .route("/create")
  .post(
    upload.fields([{ name: "avatar", maxCount: 1 }]),
    permissionMiddleware("manageUsers"),
    createUser
  );

router.use(authMiddleware);

router
  .route("/:userId")
  .get(getUserProfile)
  .patch(
    upload.fields([{ name: "avatar", maxCount: 1 }]),
    permissionMiddleware("manageUsers"),
    updateUserProfile
  )
  .delete(blockUser);

router
  .route("/:userId/updatePermissions")
  .patch(permissionMiddleware("manageUsers"), updateUserPermissions);
router
  .route("/:userId/unblock")
  .get(permissionMiddleware("manageUsers"), unblockUser);
router
  .route("/:userId/updateAvatar")
  .patch(upload.fields([{ name: "avatar", maxCount: 1 }]), updateUserAvatar);

export default router;
