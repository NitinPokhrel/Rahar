// controllers/product.controller.js
import { Product, Category, ProductVariant, Review, User } from "../models/index.model.js";
import { Op, fn, col } from "sequelize";
import { sequelize } from "../models/index.model.js";

export const getAllProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      search,
      category,
      minPrice,
      maxPrice,
      sortBy = "createdAt",
      sortOrder = "DESC",
      featured,
      tags
    } = req.query;

    const offset = (page - 1) * limit;

    const whereConditions = { isActive: true };

    if (search) {
      whereConditions[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { shortDescription: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (category) whereConditions.categoryId = category;
    if (minPrice || maxPrice) {
      whereConditions.price = {};
      if (minPrice) whereConditions.price[Op.gte] = minPrice;
      if (maxPrice) whereConditions.price[Op.lte] = maxPrice;
    }

    if (featured === 'true') whereConditions.isFeatured = true;

    if (tags) {
      const tagArray = tags.split(',');
      whereConditions.tags = { [Op.overlap]: tagArray };
    }

    const { count, rows: products } = await Product.findAndCountAll({
      where: whereConditions,
      include: [
        { model: Category, as: "category", attributes: ["id", "name", "slug"] },
        { model: ProductVariant, as: "variants", where: { isActive: true }, required: false, attributes: ["id", "name", "price", "comparePrice", "stockQuantity"] }
      ],
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      status: "success",
      data: {
        products,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: count,
          itemsPerPage: parseInt(limit),
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ status: "error", message: "Internal Server Error" });
  }
};

export const getSingleProduct = async (req, res) => {
  try {
    const { slug } = req.params;

    const product = await Product.findOne({
      where: { slug, isActive: true },
      include: [
        { model: Category, as: "category", attributes: ["id", "name", "slug"] },
        { model: ProductVariant, as: "variants", where: { isActive: true }, required: false },
        {
          model: Review,
          as: "reviews",
          where: { isApproved: true },
          required: false,
          include: [
            { model: User, as: "user", attributes: ["id", "firstName", "lastName", "avatar"] }
          ],
          order: [["createdAt", "DESC"]],
          limit: 10
        }
      ]
    });

    if (!product) {
      return res.status(404).json({ status: "error", message: "Product not found" });
    }

    const avgRating = await Review.findOne({
      where: { productId: product.id, isApproved: true },
      attributes: [
        [fn('AVG', col('rating')), 'avgRating'],
        [fn('COUNT', col('id')), 'totalReviews']
      ],
      raw: true
    });

    res.status(200).json({
      status: "success",
      data: {
        product: {
          ...product.toJSON(),
          avgRating: parseFloat(avgRating?.avgRating || 0).toFixed(1),
          totalReviews: parseInt(avgRating?.totalReviews || 0)
        }
      }
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ status: "error", message: "Internal Server Error" });
  }
};

export const getFeaturedProducts = async (req, res) => {
  try {
    const { limit = 8 } = req.query;

    const products = await Product.findAll({
      where: { isActive: true, isFeatured: true },
      include: [
        { model: Category, as: "category", attributes: ["id", "name", "slug"] }
      ],
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit)
    });

    res.status(200).json({ status: "success", data: { products } });
  } catch (error) {
    console.error("Error fetching featured products:", error);
    res.status(500).json({ status: "error", message: "Internal Server Error" });
  }
};

export const getRelatedProducts = async (req, res) => {
  try {
    const { productId } = req.params;
    const { limit = 4 } = req.query;

    const product = await Product.findByPk(productId, {
      attributes: ["categoryId"]
    });

    if (!product) {
      return res.status(404).json({ status: "error", message: "Product not found" });
    }

    const relatedProducts = await Product.findAll({
      where: {
        categoryId: product.categoryId,
        id: { [Op.ne]: productId },
        isActive: true
      },
      include: [
        { model: Category, as: "category", attributes: ["id", "name", "slug"] }
      ],
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit)
    });

    res.status(200).json({ status: "success", data: { products: relatedProducts } });
  } catch (error) {
    console.error("Error fetching related products:", error);
    res.status(500).json({ status: "error", message: "Internal Server Error" });
  }
};
