
import { Router } from "express";
import { Category } from "../models/index.model.js";

const router = Router();

// Get all active categories with hierarchy
router.get("/", async (req, res) => {
  try {
    const categories = await Category.findAll({
      where: { isActive: true },
      include: [
        {
          model: Category,
          as: "parent",
          attributes: ["id", "name", "slug"]
        },
        {
          model: Category,
          as: "children",
          where: { isActive: true },
          required: false,
          attributes: ["id", "name", "slug", "image", "description"]
        }
      ],
      order: [["sortOrder", "ASC"], ["name", "ASC"]]
    });

    return res.status(200).json({
      message: "Categories fetched successfully",
      status: "success",
      data: categories
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Get category by slug with products
router.get("/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const category = await Category.findOne({
      where: { slug, isActive: true },
      include: [
        {
          model: Product,
          as: "products",
          where: { isActive: true },
          required: false,
          limit: parseInt(limit),
          offset: parseInt(offset),
          include: [
            {
              model: ProductVariant,
              as: "variants",
              where: { isActive: true },
              required: false
            }
          ]
        }
      ]
    });

    if (!category) {
      return res.status(404).json({
        message: "Category not found",
        status: "error"
      });
    }

    return res.status(200).json({
      message: "Category fetched successfully",
      status: "success",
      data: category
    });
  } catch (error) {
    console.error("Error fetching category:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

export default router;