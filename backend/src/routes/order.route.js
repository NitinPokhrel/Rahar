// routes/order.routes.js
import { Router } from "express";
import {
  createOrder,
  getUserOrders,
  getSingleOrder,
  cancelOrder,
  changeOrderStatus,
} from "../controllers/order.controller.js";

const router = Router();

router.route("/").post(createOrder).get(getUserOrders);
router.route("/:orderId").get(getSingleOrder);
router.route("/:orderId/status").patch(permissionMiddleware('manageOrders'), changeOrderStatus);
router.route("/:orderId/cancel").patch(cancelOrder);

export default router;
