// routes/user.routes.js
import { Router } from "express";
import {
  getUserProfile,
  updateUserProfile
} from "../controllers/user.controller.js";

const router = Router();

router.route("/").get(getUserProfile).patch(updateUserProfile);

export default router;
