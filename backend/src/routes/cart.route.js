import { Router } from "express";
import {
  getCartItems,
  addCart,
  updateCart,
  removeCartItem,
} from "../controllers/cart.controller.js";

const router = Router();

router.route("/").get(getCartItems);
router.route("/add").post(addCart);
router.route("/update/:cartItemId").put(updateCart);
router.route("/:cartItemId").delete(removeCartItem);

export default router;
