import  { Router } from "express";
import { getAvailableCoupons, validateCoupon } from "../controllers/coupon.controller.js";


const router = Router();

 router.route("/validate").post(validateCoupon);
router.route("/available").get(getAvailableCoupons);


export default router;   