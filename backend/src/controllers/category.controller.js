

import { photoWork } from "../config/photoWork.js";
import { Category } from "../models/index.model.js";




export const getCategories = async (req, res) => {
  try {
    const categories = await Category.findAll({
      include: [
        { model: Category, as: "parent" },
        { model: Category, as: "children" },
      ],
      order: [["name", "ASC"]],
    });

    return res.status(200).json({
      message: "Categories retrieved successfully",
      categories,
    });
  } catch (error) {
    console.error("Error retrieving categories:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};


export const createCategory = async (req, res) => {
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
      
      image = photo.secure_url; 
      console.log("✅ Uploaded image:", image);
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

    return res.status(201).json({
      message: "Category created successfully",
      category,
    });

  } catch (error) {
    console.error("Error creating category:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};



export const updateCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;

    const [updatedRows] = await Category.update(req.body, {
      where: { id: categoryId },
    });

    if (updatedRows === 0) {
      return res.status(404).json({ message: "Category not found" });
    }

    const updatedCategory = await Category.findByPk(categoryId);

    return res.status(200).json({
      message: "Category updated successfully",
      category: updatedCategory,
    });
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};


export const deleteCategory =  async (req, res) => {
  try {
    const categoryId = req.params.id;

    const category = await Category.findByPk(categoryId);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    await category.destroy();

    return res.status(200).json({
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const getCategoryBySlug =  async (req, res) => {
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
};

