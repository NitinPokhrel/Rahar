import express from 'express';
import {
  createProduct,
  updateProduct,
  deleteProduct,
  getProductById,
  getAllProducts,
  getFeaturedProducts,
  getRelatedProducts
} from '../controllers/product.controller.js';
import  upload  from '../config/multer.js';

const router = express.Router();

// Public routes
router.get('/', getAllProducts); 
router.get('/featured', getFeaturedProducts); 
router.get('/related/:productId', getRelatedProducts); 
router.get('/:id', getProductById);
// Admin-only routes
router.post(
  "/",
  upload.any(),
  createProduct
); 

router.put(
  "/:id",
  upload.fields([{ name: "images", maxCount: 20 }]),
  updateProduct
);
router.delete('/:id', deleteProduct); 

export default router;
