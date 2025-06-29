import  { Router } from "express";
import {
  cartItems,
  addCart,
  updateCart,
  removeCartItem,
  deleteEntireCart,
  getCartSummary} from "../controllers/cart.controller.js";

const router = Router();

 router.route("/").get(cartItems);
router.route("/add").post(addCart);
router.route("/update/:cartItemId").put(updateCart);
router.route("/remove/:cartItemId").delete(removeCartItem);
router.route("/clear").delete(deleteEntireCart);
router.route("/summary").get(getCartSummary);



export default router;   