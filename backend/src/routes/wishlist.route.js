import { Router } from "express";
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  removeFromWishlistByProduct,
  clearWishlist,
  checkInWishlist,
  getWishlistCount,
  moveToCart
} from "../controllers/wishlist.controller.js";

const router = Router();

router.get("/", getWishlist);
router.post("/add", addToWishlist);
router.delete("/:wishlistItemId", removeFromWishlist);
router.delete("/product/:productId", removeFromWishlistByProduct);
router.delete("/", clearWishlist);
router.get("/check/:productId", checkInWishlist);
router.get("/count", getWishlistCount);
router.post("/:wishlistItemId/move-to-cart", moveToCart);

export default router;
