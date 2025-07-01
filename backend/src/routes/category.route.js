import  { Router } from "express";
import { getAllCategories, getCategoryBySlug } from "../controllers/category.controller.js";

const router = Router();

router.route("/").get(getAllCategories);
router.route("/:slug").get(getCategoryBySlug);


export default router;   