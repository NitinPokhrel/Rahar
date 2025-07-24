// couponRoutes.js
import express from 'express';

import { applyCoupon, createCoupon, getAllCoupons, getCouponUsage, getUserCoupons, removeCoupon, restoreCoupon, updateCoupon } from '../controllers/coupon.controller.js';


const router = express.Router();

// Public routes
router.post('/apply', applyCoupon);
router.get('/user/:userId',  getUserCoupons);
router.get('/',getAllCoupons)


// Admin routes
router.delete('/:id', permissionMiddleware('manageCoupons'),  removeCoupon);
router.patch('/:id/restore', permissionMiddleware('manageCoupons'), restoreCoupon);
router.post('/create', permissionMiddleware('manageCoupons'), createCoupon);
router.put('/:id/update', permissionMiddleware('manageCoupons'), updateCoupon);
router.get('/:couponId/usage', permissionMiddleware('manageCoupons'), getCouponUsage);

export default router;