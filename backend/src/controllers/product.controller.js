// controllers/product.controller.js
import {
  Product,
  Category,
  ProductVariant,
  Review,
  User,
  sequelize,
} from "../models/index.model.js";
import { Op } from "sequelize";
import { deleteImage, photoWork } from "../config/photoWork.js";

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
      tags,
    } = req.query;

    const offset = (page - 1) * limit;

    const whereConditions = { isActive: true };

    if (search) {
      whereConditions[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { shortDescription: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (category) whereConditions.categoryId = category;
    if (minPrice || maxPrice) {
      whereConditions.price = {};
      if (minPrice) whereConditions.price[Op.gte] = minPrice;
      if (maxPrice) whereConditions.price[Op.lte] = maxPrice;
    }

    if (featured === "true") whereConditions.isFeatured = true;

    if (tags) {
      const tagArray = tags.split(",");
      whereConditions.tags = { [Op.overlap]: tagArray };
    }

    const { count, rows: products } = await Product.findAndCountAll({
      where: whereConditions,
      include: [
        { model: Category, as: "category", attributes: ["id", "name", "slug"] },
        {
          model: ProductVariant,
          as: "variants",
          where: { isActive: true },
          required: false,
          attributes: ["id", "name", "price", "comparePrice", "stockQuantity"],
        },
      ],
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true,
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
          hasPrevPage: page > 1,
        },
      },
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
        { model: Category, as: "category", attributes: ["id", "name", "slug"] },
      ],
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
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
      attributes: ["categoryId"],
    });

    if (!product) {
      return res
        .status(404)
        .json({ status: "error", message: "Product not found" });
    }

    const relatedProducts = await Product.findAll({
      where: {
        categoryId: product.categoryId,
        id: { [Op.ne]: productId },
        isActive: true,
      },
      include: [
        { model: Category, as: "category", attributes: ["id", "name", "slug"] },
      ],
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
    });

    res
      .status(200)
      .json({ status: "success", data: { products: relatedProducts } });
  } catch (error) {
    console.error("Error fetching related products:", error);
    res.status(500).json({ status: "error", message: "Internal Server Error" });
  }
};

// ***************************** -------------------     **************************

export const updateProduct = async (req, res) => {
  try {
    const productId = req.params.id;

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
      isActive,
      isFeatured,
      tags,
      metaTitle,
      metaDescription,
    } = req.body;

    const imagesToKeep = req.body.imagesToKeep
      ? JSON.parse(req.body.imagesToKeep)
      : [];
    const imagesToReplace = req.body.imagesToReplace
      ? JSON.parse(req.body.imagesToReplace)
      : [];

    const product = await Product.findByPk(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    let updatedImages = [];

    // 1. Keep untouched images
    if (Array.isArray(product.images)) {
      for (const img of product.images) {
        if (imagesToKeep.includes(img.public_id)) {
          updatedImages.push(img);
        }
      }
    }

    // 2. Replace selected images
    if (imagesToReplace.length && req.files) {
      for (const replacement of imagesToReplace) {
        const { oldPublicId } = replacement;
        const file = req.files[oldPublicId]?.[0];

        if (!file) continue;

        try {
          await deleteImage(oldPublicId);
        } catch (err) {
          return res.status(500).json({
            message: `Failed to delete image: ${oldPublicId}`,
            error: err.message,
          });
        }

        try {
          const newPhoto = await photoWork(file);
          updatedImages.push({
            url: newPhoto.secure_url,
            width: newPhoto.width,
            height: newPhoto.height,
            blurhash: newPhoto.blurhash || null,
            public_id: newPhoto.public_id,
          });
        } catch (err) {
          return res.status(500).json({
            message: `Failed to upload replacement image for ${oldPublicId}`,
            error: err.message,
          });
        }
      }
    }

    // 3. Add brand new images
    const newImages = req.files["images"] || [];
    const remainingSlots = 5 - updatedImages.length;

    for (let i = 0; i < Math.min(newImages.length, remainingSlots); i++) {
      try {
        const photo = await photoWork(newImages[i]);
        updatedImages.push({
          url: photo.secure_url,
          width: photo.width,
          height: photo.height,
          blurhash: photo.blurhash || null,
          public_id: photo.public_id,
        });
      } catch (err) {
        return res.status(500).json({
          message: `Failed to upload new image at index ${i}`,
          error: err.message,
        });
      }
    }

    // Validation: must have at least one image
    if (!updatedImages.length) {
      return res
        .status(400)
        .json({ message: "At least one image is required" });
    }

    // 4. Perform the DB update (only if all above image operations succeeded)
    try {
      await Product.update(
        {
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
          images: updatedImages,
        },
        { where: { id: productId } }
      );
    } catch (dbError) {
      return res.status(500).json({
        message: "Database update failed",
        error: dbError.message,
      });
    }

    const updatedProduct = await Product.findByPk(productId, {
      include: [{ model: Category, as: "category" }],
    });

    return res.status(200).json({
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Unexpected error updating product:", error);
    return res.status(500).json({
      message: "Unexpected internal server error",
      error: error.message,
    });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const productId = req.params.id;

    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    // Delete associated images

    if (Array.isArray(product.images)) {
      for (const img of product.images) {
        if (img.public_id) {
          await deleteImage(img.public_id);
          console.log(`Image deleted: ${img.public_id}`);
        }
      }
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
};

export const createProduct = async (req, res) => {
  const transaction = await sequelize.transaction();

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
      variants, // as JSON string
    } = req.body;

    let images = [];

    if (req.files && req.files.length > 0) {
      // Filter files that have fieldname 'images'
      const imageFiles = req.files.filter(
        (file) => file.fieldname === "images"
      );

      for (const file of imageFiles) {
        const photo = await photoWork(file);
        images.push({
          url: photo.secure_url,
          height: photo.height,
          width: photo.width,
          blurhash: photo.blurhash || null,
          public_id: photo.public_id,
        });
      }
    }

    if (!images.length) {
      console.log(images, " No images found in request");
      return res
        .status(400)
        .json({ message: "At least one image is required" });
    }

    // === Create product first
    const product = await Product.create(
      {
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
      },
      { transaction }
    );

    // === Handle variants if present
    if (variants) {
      let parsedVariants;

      try {
        parsedVariants = JSON.parse(variants);
      } catch (err) {
        throw new Error("Invalid JSON format in variants field.");
      }

      const variantPayloads = [];

      for (const variant of parsedVariants) {
        const {
          sku: variantSku,
          name,
          price,
          comparePrice,
          stockQuantity,
          attributes,
          description,
          isActive,
        } = variant;

        let variantImage = null;

        // Find variant image file in req.files array
        const fieldName = `variantImage_${variantSku}`;
        const variantFile = req.files.find(
          (file) => file.fieldname === fieldName
        );

        if (variantFile) {
          const uploaded = await photoWork(variantFile);
          variantImage = {
            url: uploaded.secure_url,
            height: uploaded.height,
            width: uploaded.width,
            blurhash: uploaded.blurhash || null,
            public_id: uploaded.public_id,
          };
        }

        variantPayloads.push({
          productId: product.id,
          sku: variantSku,
          name,
          price,
          comparePrice,
          stockQuantity,
          attributes,
          description,
          isActive,
          images: variantImage,
        });
      }

      await ProductVariant.bulkCreate(variantPayloads, { transaction });
    }

    await transaction.commit();

    return res.status(201).json({
      message: "Product and variants created successfully",
      productId: product.id,
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error creating product with variants:", error);
    return res.status(500).json({
      message: "Failed to create product and variants",
      error: error.message,
    });
  }
};
