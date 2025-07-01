// routes/newsletter.routes.js
import { Router } from "express";
import {
  subscribeNewsletter,
  unsubscribeNewsletter
} from "../controllers/newsLetterSubscription.controller.js";

const router = Router();

router.route("/subscribe").post(subscribeNewsletter);
router.route("/unsubscribe").post(unsubscribeNewsletter);

export default router;
