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
      return res.status(404).send({
        success: false,
        status: "Error getting product",
        message: "Product not found",
      });
    }

    return res.status(200).send({
      success: true,
      status: "successful",
      message: "Product retrieved successfully",
      data: product,
    });
  } catch (error) {
    console.error("Error retrieving product:", error);
    res.status(500).send({
      success: false,
      status: "Product retrieval error",
      message: error.message || "Internal Server Error",
    });
  }
};

export const getAllProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
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
      success: true,
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
    res.status(500).json({
      success: false,
      status: "Error fetching products",
      message: error.message || "Internal Server Error",
    });
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
    res.status(500).json({
      success: false,
      status: "Error getting featured products",
      message: error.message || "Internal Server Error",
    });
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
      return res.status(404).json({
        success: false,
        status: "Error getting related products",
        message: "Product not found",
      });
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

    return res.status(200).json({
      success: true,
      status: "Successful",
      data: { products: relatedProducts },
    });
  } catch (error) {
    console.error("Error fetching related products:", error);
    res.status(500).json({
      success: false,
      status: "Error getting related products",
      message: error.message || "Internal Server Error",
    });
  }
};

// ***************************** -------------------     **************************

export const updateProduct = async (req, res) => {
  let uploadedImageIds = [];
  console.log(req.files);
  try {
    const productId = req.params.id;
    const product = await Product.findByPk(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        status: "Error updating product",
        message: "Product not found",
      });
    }

    // Extract and validate basic product data
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

    // Parse image configuration
    let imagesToKeep = [];
    let imagesToReplace = [];

    try {
      imagesToKeep = req.body.imagesToKeep
        ? JSON.parse(req.body.imagesToKeep)
        : [];
      imagesToReplace = req.body.imagesToReplace
        ? JSON.parse(req.body.imagesToReplace)
        : [];
    } catch (error) {
      return res.status(400).send({
        success: false,
        status: "Error updating product",
        message: "Invalid image configuration format",
      });
    }

    // Start building the updated images array
    let updatedImages = [];

    // 1. Keep existing images that are marked to keep
    if (Array.isArray(product.images)) {
      for (const img of product.images) {
        if (imagesToKeep.includes(img.public_id)) {
          updatedImages.push(img);
        }
      }
    }

    // 2. Replace selected images
    if (imagesToReplace.length > 0 && req.files) {
      for (const replacement of imagesToReplace) {
        const { oldPublicId } = replacement;

        // Find the replacement file (fieldname should match oldPublicId)
        const replacementFile = req.files.find(
          (f) => f.fieldname === oldPublicId
        );
        console.log("Replacement file:", replacementFile);

        if (replacementFile) {
          try {
            // Upload new image first
            const newPhoto = await photoWork(replacementFile);
            uploadedImageIds.push(newPhoto.public_id);

            // Delete old image after successful upload
            await deleteImage(oldPublicId);
            console.log(
              `Replaced image: ${oldPublicId} -> ${newPhoto.public_id}`
            );

            // Add new image to the array
            updatedImages.push({
              url: newPhoto.secure_url,
              width: newPhoto.width,
              height: newPhoto.height,
              blurhash: newPhoto.blurhash || null,
              public_id: newPhoto.public_id,
            });
          } catch (error) {
            // Cleanup uploaded images on error
            for (const publicId of uploadedImageIds) {
              try {
                await deleteImage(publicId);
              } catch (cleanupError) {
                console.warn(
                  `Failed to cleanup image ${publicId}:`,
                  cleanupError.message
                );
              }
            }
            return res.status(500).json({
              success: false,
              status: `Failed to replace image ${oldPublicId}`,
              message: error.message || " Something went wrong ",
            });
          }
        }
      }
    }

    // 3. Add new images (fieldname = "images")
    if (req.files && req.files.images) {
      const newImages = req.files.images;

      for (let i = 0; i < newImages.length; i++) {
        try {
          const photo = await photoWork(newImages[i]);
          uploadedImageIds.push(photo.public_id);

          updatedImages.push({
            url: photo.secure_url,
            width: photo.width,
            height: photo.height,
            blurhash: photo.blurhash || null,
            public_id: photo.public_id,
          });
        } catch (error) {
          // Cleanup uploaded images on error
          for (const publicId of uploadedImageIds) {
            try {
              await deleteImage(publicId);
            } catch (cleanupError) {
              console.warn(
                `Failed to cleanup image ${publicId}:`,
                cleanupError.message
              );
            }
          }
          return res.status(500).json({
            success: false,
            status: `Failed to upload new image at index ${i}`,
            message: error.message || " Something went wrong ",
          });
        }
      }
    }

    // Validate that we have at least one image
    if (updatedImages.length === 0) {
      // Cleanup any uploaded images
      for (const publicId of uploadedImageIds) {
        try {
          await deleteImage(publicId);
        } catch (cleanupError) {
          console.warn(
            `Failed to cleanup image ${publicId}:`,
            cleanupError.message
          );
        }
      }
      return res.status(400).json({
        success: false,
        status: "Error updating product",
        message: "At least one image is required",
      });
    }

    // Prepare update data with type conversion
    const updateData = {
      name: name?.trim(),
      slug,
      description,
      shortDescription,
      sku,
      categoryId,
      price: parseFloat(price) || 0,
      comparePrice: parseFloat(comparePrice) || 0,
      costPrice: parseFloat(costPrice) || 0,
      stockQuantity: parseInt(stockQuantity) || 0,
      lowStockThreshold: parseInt(lowStockThreshold) || 0,
      isActive: Boolean(isActive),
      isFeatured: Boolean(isFeatured),
      tags: Array.isArray(tags) ? tags : tags ? [tags] : [],
      metaTitle,
      metaDescription,
      images: updatedImages,
    };

    // Update product in database
    const updateResult = await Product.update(updateData, {
      where: { id: productId },
    });

    if (updateResult[0] === 0) {
      // Cleanup uploaded images if database update failed
      for (const publicId of uploadedImageIds) {
        try {
          await deleteImage(publicId);
        } catch (cleanupError) {
          console.warn(
            `Failed to cleanup image ${publicId}:`,
            cleanupError.message
          );
        }
      }
      return res.status(500).json({
        success: false,
        status: "Error updating product",
        message: "Product update failed - no rows affected",
      });
    }

    // Fetch updated product with relations
    const updatedProduct = await Product.findByPk(productId, {
      include: [{ model: Category, as: "category" }],
    });

    return res.status(200).json({
      success: true,
      status: "Product updated successfully",
      data: updatedProduct,
    });
  } catch (error) {
    // Cleanup uploaded images on any unexpected error
    for (const publicId of uploadedImageIds) {
      try {
        await deleteImage(publicId);
      } catch (cleanupError) {
        console.warn(
          `Failed to cleanup image ${publicId}:`,
          cleanupError.message
        );
      }
    }

    console.error("Error updating product:", error);

    return res.status(500).json({
      success: false,
      status: "Error updating product",
      message:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const productId = req.params.id;

    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        status: "Error deleting product",
        message: "Product not found",
      });
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
      success: true,
      status: "Successful",
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({
      success: false,
      status: "Error deleting product",
      message:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const createProduct = async (req, res) => {
  const transaction = await sequelize.transaction();

  // Track uploaded image public_ids for cleanup if needed
  let uploadedPublicIds = [];

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
      variants, // JSON string
    } = req.body;

    let images = [];

    // === Handle main product images ===
    if (req.files && req.files.length > 0) {
      const imageFiles = req.files.filter(
        (file) => file.fieldname === "images"
      );

      for (const file of imageFiles) {
        const photo = await photoWork(file);
        uploadedPublicIds.push(photo.public_id); // Track for deletion
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
      return res.status(400).json({
        success: false,
        status: "Error creating product",
        message: "At least one image is required",
      });
    }

    // === Create product
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

    // === Handle variants if provided
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
        const fieldName = `variantImage_${variantSku}`;
        const variantFile = req.files.find(
          (file) => file.fieldname === fieldName
        );

        if (variantFile) {
          const uploaded = await photoWork(variantFile);
          uploadedPublicIds.push(uploaded.public_id); // Track for cleanup
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
      success: true,
      status: "Product and variants created successfully",
      productId: product.id,
    });
  } catch (error) {
    await transaction.rollback();

    console.error("Error creating product with variants:", error);

    // Clean up uploaded images from Cloudinary
    if (uploadedPublicIds.length > 0) {
      for (const publicId of uploadedPublicIds) {
        try {
          await deleteImage(publicId);
        } catch (cleanupError) {
          console.error(
            `Failed to delete image with public_id ${publicId}:`,
            cleanupError
          );
        }
      }
    }

    return res.status(500).json({
      success: false,
      status: "Error creating product",
      message: error.message || "Internal Server Error",
    });
  }
};
