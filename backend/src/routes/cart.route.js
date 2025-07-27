import { Router } from "express";
import {
  getCartItems,
  addCart,
  updateCart,
  removeCartItem,
} from "../controllers/cart.controller.js";

const router = Router();


// All routes are auth-protected
router.get("/", getCartItems);
router.post("/add", addCart);
router.put("/update/:cartItemId", updateCart);
router.delete("/:cartItemId", removeCartItem);

export default router;