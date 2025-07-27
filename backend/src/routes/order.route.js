// routes/order.routes.js
import { Router } from "express";
import {
  createOrder,
  getUserOrders,
  getSingleOrder,
  cancelOrder,
  changeOrderStatus,
} from "../controllers/order.controller.js";
import { permissionMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

// Auth required routes
router.post("/", createOrder);
router.get("/", getUserOrders);
router.get("/:orderId", getSingleOrder);
router.patch("/:orderId/cancel", cancelOrder);

// Apply admin permission middleware to specific routes
router.patch(
  "/:orderId/status",
  permissionMiddleware("manageOrders"),
  changeOrderStatus
);

export default router;
