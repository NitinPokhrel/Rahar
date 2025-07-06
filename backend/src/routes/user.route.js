// routes/user.routes.js
import { Router } from "express";
import {
  createUser,
  getUserProfile,
  updateUserProfile,
} from "../controllers/user.controller.js";
import upload from "../config/multer.js";

const router = Router();

router
  .route("/create")
  .post(upload.fields([{ name: "avatar", maxCount: 1 }]), createUser);

router
  .route("/:userId")
  .get(getUserProfile)
  .patch(upload.fields([{ name: "avatar", maxCount: 1 }]), updateUserProfile);

router.route("/").get(getUserProfile).patch(updateUserProfile);

export default router;
