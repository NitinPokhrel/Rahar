// couponRoutes.js
import express from 'express';
import { 
  applyCoupon, 
  createCoupon, 
  getAllCoupons, 
  getCouponUsage, 
  getUserCoupons, 
  removeCoupon, 
  restoreCoupon, 
  updateCoupon 
} from '../controllers/coupon.controller.js';
import { permissionMiddleware } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public routes
router.post('/apply', applyCoupon);
router.get('/user/:userId', getUserCoupons);
router.get('/', getAllCoupons);

// Apply admin middleware to all routes below
router.use(permissionMiddleware('manageCoupons'));

// Admin routes
router.post('/create', createCoupon);
router.put('/:id/update', updateCoupon);
router.delete('/:id', removeCoupon);
router.patch('/:id/restore', restoreCoupon);
router.get('/:couponId/usage', getCouponUsage);

export default router;