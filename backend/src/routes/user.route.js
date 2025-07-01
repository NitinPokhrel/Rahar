// routes/user.routes.js
import { Router } from "express";
import {
  blockUser,
  createUser,
  getUserProfile,
  updateUserProfile,
} from "../controllers/user.controller.js";
import upload from "../config/multer.js";

const router = Router();

const createUserExample = {
  clerkUserId: "user_2abc123def453",
  id: "8b74c57b-ef05-4017-9f5a-6c7cc76d2b31",
  firstName: "         Photo        ",
  lastName: "Test         ",
  email: "            john121.doe@example.com",
  password: "securePassword123",
  phone: "+1234567890       ",
  dateOfBirth: "1990-05-15",
  gender: "male",
  role: "admin",
  permissions: [],
  address: {
    province: "California",
    city: "Los Angeles",
    fullAddress: "123 Main Street, Apt 4B, Los Angeles, CA 90210",
  },
};

async function authenticateUser(req, res, next) {
  req.user = createUserExample;
  next();
}

router.use(authenticateUser);

router
  .route("/create")
  .post(upload.fields([{ name: "avatar", maxCount: 1 }]), createUser);

router
  .route("/:userId")
  .get(getUserProfile)
  .patch(upload.fields([{ name: "avatar", maxCount: 1 }]), updateUserProfile)
  .delete(blockUser);

router.route("/").get(getUserProfile).patch(updateUserProfile);

export default router;
