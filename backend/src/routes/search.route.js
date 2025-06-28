import { Router } from "express";
import { Product, Category, ProductVariant } from "../models/index.model.js";
import { Op } from "sequelize";

const router = Router();

// Search products
router.get("/", async (req, res) => {
  try {
    const {
      q, // search query
      category,
      minPrice,
      maxPrice,
      sortBy = "relevance", // relevance, price_low, price_high, newest, rating
      page = 1,
      limit = 20,
    } = req.query;

    const offset = (page - 1) * limit;
    let whereClause = { isActive: true };
    let orderClause = [];

    // Text search
    if (q) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${q}%` } },
        { description: { [Op.iLike]: `%${q}%` } },
        { shortDescription: { [Op.iLike]: `%${q}%` } },
        { tags: { [Op.contains]: [q] } },
      ];
    }

    // Category filter
    if (category) {
      const categoryRecord = await Category.findOne({
        where: { slug: category },
      });
      if (categoryRecord) {
        whereClause.categoryId = categoryRecord.id;
      }
    }

    // Price range filter
    if (minPrice || maxPrice) {
      whereClause.price = {};
      if (minPrice) whereClause.price[Op.gte] = parseFloat(minPrice);
      if (maxPrice) whereClause.price[Op.lte] = parseFloat(maxPrice);
    }

    // Sorting
    switch (sortBy) {
      case "price_low":
        orderClause = [["price", "ASC"]];
        break;
      case "price_high":
        orderClause = [["price", "DESC"]];
        break;
      case "newest":
        orderClause = [["createdAt", "DESC"]];
        break;
      case "name":
        orderClause = [["name", "ASC"]];
        break;
      default:
        orderClause = [
          ["isFeatured", "DESC"],
          ["createdAt", "DESC"],
        ];
    }

    const products = await Product.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Category,
          as: "category",
          attributes: ["id", "name", "slug"],
        },
        {
          model: ProductVariant,
          as: "variants",
          where: { isActive: true },
          required: false,
          attributes: ["id", "name", "price", "stockQuantity"],
        },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: orderClause,
      distinct: true,
    });

    return res.status(200).json({
      message: "Search results fetched successfully",
      status: "success",
      data: {
        products: products.rows,
        pagination: {
          total: products.count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(products.count / limit),
        },
        filters: {
          query: q,
          category,
          minPrice,
          maxPrice,
          sortBy,
        },
      },
    });
  } catch (error) {
    console.error("Error searching products:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Get search suggestions
router.get("/suggestions", async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.status(200).json({
        message: "Search suggestions",
        status: "success",
        data: [],
      });
    }

    const suggestions = await Product.findAll({
      where: {
        isActive: true,
        [Op.or]: [
          { name: { [Op.iLike]: `%${q}%` } },
          { tags: { [Op.contains]: [q] } },
        ],
      },
      attributes: ["id", "name", "slug", "images"],
      limit: 10,
      order: [["name", "ASC"]],
    });

    return res.status(200).json({
      message: "Search suggestions fetched successfully",
      status: "success",
      data: suggestions,
    });
  } catch (error) {
    console.error("Error fetching search suggestions:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

export default router;
