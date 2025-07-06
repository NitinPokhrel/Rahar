// controllers/product.controller.js
import { Product, Category, ProductVariant, Review, User } from "../models/index.model.js";
import { Op, fn, col } from "sequelize";
import { photoWork } from "../config/photoWork.js";

export const updateProduct = async (req, res) => {
    try {
      const productId = req.params.id;

      const [updatedRows] = await Product.update(req.body, {
        where: { id: productId },
      });

      if (updatedRows === 0) {
        return res.status(404).json({ message: "Product not found" });
      }

      const updatedProduct = await Product.findByPk(productId, {
        include: [{ model: Category, as: "category" }],
      });

      return res.status(200).json({
        message: "Product updated successfully",
        product: updatedProduct,
      });
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({
        message: "Internal server error",
        error: error.message,
      });
    }
  }
;

export const deleteProduct = async (req, res) => {
    try {
      const productId = req.params.id;

      const product = await Product.findByPk(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      await product.destroy();

      return res.status(200).json({
        message: "Product deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({
        message: "Internal server error",
        error: error.message,
      });
    }
  }
;

export const createProduct = async (req, res) => {
  try {
    const {
      name,
      slug,
      description,
      shortDescription,
      sku,
      categoryId,
      price,
      comparePrice,
      costPrice,
      stockQuantity,
      lowStockThreshold,
      isActive = true,
      isFeatured = false,
      tags,
      metaTitle,
      metaDescription,
    } = req.body;

    let images = [];
  
    if (req.files && req.files["images"] && req.files["images"].length > 0) {
      const files = req.files["images"].slice(0, 5);

      for (const file of files) {
        const photo = await photoWork(file);
        console.log("✅ Uploaded image:", photo);
        images.push({
          url: photo.secure_url,
          height: photo.height,
          width: photo.width,
          blurhash: photo.blurhash || null,
          public_id: photo.public_id,
        });
      }
      console.log("✅ All images uploaded:", images);
    }

    const product = await Product.create({
      name,
      slug,
      description,
      shortDescription,
      sku,
      categoryId,
      price,
      comparePrice,
      costPrice,
      stockQuantity,
      lowStockThreshold,
      isActive,
      isFeatured,
      tags,
      metaTitle,
      metaDescription,
      images,
    });

    return res.status(201).json({
      message: " Product created successfully",
      product,
    });

  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};





export const getProductById = async (req, res) => {
  try {
    const productId = req.params.id;

    const product = await Product.findByPk(productId, {
      include: [
        { model: Category, as: "category" },
        { model: ProductVariant, as: "variants" },
        {
          model: Review,
          as: "reviews",
          include: [{ model: User, as: "user" }],
        },
      ],
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.status(200).json({
      message: "Product retrieved successfully",
      product,
    });
  } catch (error) {
    console.error("Error retrieving product:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

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
