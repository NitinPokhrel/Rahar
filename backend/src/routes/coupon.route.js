// couponRoutes.js
import express from 'express';

import { applyCoupon, createCoupon, getCouponUsage, getUserCoupons, removeCoupon, validateCoupon } from '../controllers/coupon.controller.js';

const router = express.Router();

// Public routes
router.post('/create', createCoupon);
router.post('/apply', applyCoupon);
router.get('/validate/:code', validateCoupon);
router.delete('/remove',  removeCoupon);
router.get('/user/:userId',  getUserCoupons);

// Admin routes
router.get('/admin/:couponId/usage', getCouponUsage);

export default router;