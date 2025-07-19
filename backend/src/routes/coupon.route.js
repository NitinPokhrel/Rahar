// couponRoutes.js
import express from 'express';

import { applyCoupon, createCoupon, getAllCoupons, getCouponUsage, getUserCoupons, removeCoupon, restoreCoupon, updateCoupon } from '../controllers/coupon.controller.js';


const router = express.Router();

// Public routes
router.post('/apply', applyCoupon);
router.get('/user/:userId',  getUserCoupons);
router.get('/',getAllCoupons)


// Admin routes
router.delete('/:id',  removeCoupon);
router.patch('/:id/restore',restoreCoupon);
router.post('/create', createCoupon);
router.put('/:id/update', updateCoupon);
router.get('/:couponId/usage', getCouponUsage);

export default router;