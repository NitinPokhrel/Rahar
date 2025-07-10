import { deleteImage, photoWork } from "../config/photoWork.js";
import { Category } from "../models/index.model.js";
import { Product, ProductVariant } from "../models/index.model.js";

export const getCategories = async (req, res) => {
  try {
    const categories = await Category.findAll({
      include: [
        { model: Category, as: "parent" },
        { model: Category, as: "children" },
      ],
      order: [["name", "ASC"]],
    });

    return res.status(200).send(
      {
        message: "Categories retrieved successfully",
        status: "success",
        data: categories,
      }
    );
  } catch (error) {
    console.error("Error retrieving categories:", error);
    res.status(500).send({
      message: "Internal Server Error",
      error: error.message,
      status: "error",

    });
  }
};

export const getCategoryBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    console.log("Fetching category with slug:", slug);
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
              required: false,
            },
          ],
        },
      ],
    });

    if (!category) {
      return res.status(404).send({
        message: "Category not found",
        status: "error",
      });
    }

    return res.status(200).json({
      message: "Category fetched successfully",
      status: "success",
      data: category,
    });
  } catch (error) {
    console.error("Error fetching category:", error);
    res.status(500).send({
      message: "Internal Server Error",
      error: error.message,
      status: "error",
    })
  }
};

// ****************************   -------------------     **************************

export const createCategory = async (req, res) => {
  let uploadedPublicId = null;
  try {
    const {
      name,
      slug,
      description,
      isActive = true,
      sortOrder = 0,
      metaTitle,
      metaDescription,
    } = req.body;

    let image = null;

    // Handle image upload
    if (req.files && req.files["image"] && req.files["image"].length > 0) {
      const file = req.files["image"][0];
      const photo = await photoWork(file);
       uploadedPublicId = photo.public_id;
      if (!photo) {
        return res.status(400).send({
          message: "Failed to upload image",
          status: "error",
        })
      }

      image = {
        url: photo.secure_url,
        public_id: photo.public_id,
        height: photo.height,
        width: photo.width,
        blurhash: photo.blurhash || null,
      };

      console.log("Uploaded image:", photo);
    }

    // Create category
    const category = await Category.create({
      name,
      slug,
      description,
      isActive,
      sortOrder,
      metaTitle,
      metaDescription,
      image,
    });

    return res.status(201).send({
      message: "Category created successfully",
      status: "success",
      data: category,
    })
  } catch (error) {
    // If image upload failed, delete the uploaded image if it exists
    if (uploadedPublicId) {
      try {
        await deleteImage(uploadedPublicId);
      } catch (deleteError) {
        console.error("Failed to delete uploaded image:", deleteError);
      }
    }
    console.error("Error creating category:", error);
    return res.status(500).send({
      message: "Internal server error",
      error: error.message,
      status: "error",
    })
  }
};



export const updateCategory = async (req, res) => {
  let uploadedPublicId = null;
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    const category = await Category.findByPk(id);
    if (!category) {
      return res.status(404).send({
        message: "Category not found",
        status: "error",
      });
    }

    // Handle new image upload
    if (req.files && req.files["image"] && req.files["image"].length > 0) {
      const file = req.files["image"][0];
      const photo = await photoWork(file);
      uploadedPublicId = photo.public_id;
      if (!photo) {
        return res.status(400).send({
          message: "Failed to upload image",
          status: "error",
        })
      }
      updates.image = {
        url: photo.secure_url,
        public_id: photo.public_id,
        height: photo.height,
        width: photo.width,
        blurhash: photo.blurhash || null,
      };
      // delete previous image
      if (category.image && category.image.public_id) {
        const deletedImage = await deleteImage(category.image.public_id);
        if (!deletedImage) {
          console.error(
            "Failed to delete old image:",
            category.image.public_id
          );
          return res.status(500).send({
            message: "Failed to delete old image",
            status: "error",
            data: category.image,
          })
        }
        console.log("Deleted old image:", category.image);
      }
    }

    // Update category
    await category.update(updates);

    return res.status(200).send({
      message: "Category updated successfully",
      status: "success",
      data: category,
    })
  } catch (error) {
  // If image upload failed, delete the uploaded image if it exists
    if (uploadedPublicId) {
      try {
        await deleteImage(uploadedPublicId);
      } catch (deleteError) {
        console.error("Failed to delete uploaded image:", deleteError);
      }
    }
    console.error("Error updating category:", error);
    res.status(500).send({
      message: "Internal server error",
      error: error.message,
    })
  }
};

export const deleteCategory = async (req, res) => {
  let uploadedPublicId = null;
  try {
    const categoryId = req.params.id;

    const category = await Category.findByPk(categoryId);
    if (!category) {
      return res.status(404).send({
        message: "Category not found",
        status: "error",
      })
    }

    // check for associated products
    const products = await Product.findAll({
      where: { categoryId: category.id, isActive: true },
    });
    if (category.image && category.image.public_id) {
      const deletedImage = await deleteImage(category.image.public_id);
      if (!deletedImage) {
        console.error("Failed to delete category image:", category.image.public_id);
        return res.status(500).send({
          message: "Failed to delete category image",
          success: false,
          status: "Failed to Delete",
          data: category.image,
        });
      }
      console.log("Deleted category image:", category.image);
    }

    if (products.length > 0) {
      return res.status(400).send({
        success: false,
        status: "Failed to Delete",
        message: "Cannot delete category with associated products",
        data: products
      });
    }

    await category.destroy();

    return res.status(200).send({
      message: "Category deleted successfully",
      status: "success",
      data: category,
    })
  } catch (error) {
    console.error("Error deleting category:", error);
    // delete image if it exists
   
    res.status(500).send({
      message: "Internal server error",
      error: error.message,
      status: "error",
    })
  }
};
