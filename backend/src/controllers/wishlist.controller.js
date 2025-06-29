import { Wishlist, Product, Category, Cart } from "../models/index.model.js";
import { Op } from "sequelize";

// Get user's wishlist
export const getWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 12 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows } = await Wishlist.findAndCountAll({
      where: { userId },
      include: [
        {
          model: Product,
          as: "product",
          attributes: [
            "id", "name", "slug", "images", "price", "comparePrice",
            "stockQuantity", "isActive", "isFeatured"
          ],
          where: { isActive: true },
          required: true,
          include: [
            {
              model: Category,
              as: "category",
              attributes: ["id", "name", "slug"]
            }
          ]
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["createdAt", "DESC"]]
    });

    return res.status(200).json({
      status: "success",
      data: {
        wishlistItems: rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit),
          hasNextPage: page < Math.ceil(count / limit),
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    res.status(500).json({ status: "error", message: "Internal Server Error" });
  }
};

export const addToWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ status: "error", message: "Product ID is required" });
    }

    const product = await Product.findOne({ where: { id: productId, isActive: true } });
    if (!product) {
      return res.status(404).json({ status: "error", message: "Product not found or inactive" });
    }

    const existing = await Wishlist.findOne({ where: { userId, productId } });
    if (existing) {
      return res.status(400).json({ status: "error", message: "Product already in wishlist" });
    }

    const wishlistItem = await Wishlist.create({ userId, productId });

    const completeWishlistItem = await Wishlist.findByPk(wishlistItem.id, {
      include: [
        {
          model: Product,
          as: "product",
          attributes: ["id", "name", "slug", "images", "price", "comparePrice", "stockQuantity", "isActive", "isFeatured"],
          include: [
            { model: Category, as: "category", attributes: ["id", "name", "slug"] }
          ]
        }
      ]
    });

    res.status(201).json({
      status: "success",
      message: "Product added to wishlist",
      data: { wishlistItem: completeWishlistItem }
    });
  } catch (error) {
    console.error("Error adding to wishlist:", error);
    res.status(500).json({ status: "error", message: "Internal Server Error" });
  }
};

export const removeFromWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { wishlistItemId } = req.params;

    const item = await Wishlist.findOne({ where: { id: wishlistItemId, userId } });
    if (!item) {
      return res.status(404).json({ status: "error", message: "Wishlist item not found" });
    }

    await item.destroy();
    res.status(200).json({ status: "success", message: "Removed from wishlist" });
  } catch (error) {
    console.error("Error removing wishlist item:", error);
    res.status(500).json({ status: "error", message: "Internal Server Error" });
  }
};

export const removeFromWishlistByProduct = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    const item = await Wishlist.findOne({ where: { userId, productId } });
    if (!item) {
      return res.status(404).json({ status: "error", message: "Product not in wishlist" });
    }

    await item.destroy();
    res.status(200).json({ status: "success", message: "Removed from wishlist" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ status: "error", message: "Internal Server Error" });
  }
};

export const clearWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    await Wishlist.destroy({ where: { userId } });
    res.status(200).json({ status: "success", message: "Wishlist cleared" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ status: "error", message: "Internal Server Error" });
  }
};

export const checkInWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    const item = await Wishlist.findOne({ where: { userId, productId } });
    res.status(200).json({
      status: "success",
      data: {
        inWishlist: !!item,
        wishlistItemId: item?.id || null
      }
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ status: "error", message: "Internal Server Error" });
  }
};

export const getWishlistCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await Wishlist.count({
      where: { userId },
      include: [
        { model: Product, as: "product", where: { isActive: true }, required: true }
      ]
    });

    res.status(200).json({ status: "success", data: { count } });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ status: "error", message: "Internal Server Error" });
  }
};

export const moveToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { wishlistItemId } = req.params;
    const { quantity = 1, variantId = null } = req.body;

    const item = await Wishlist.findOne({
      where: { id: wishlistItemId, userId },
      include: [{ model: Product, as: "product", where: { isActive: true }, required: true }]
    });

    if (!item) {
      return res.status(404).json({ status: "error", message: "Wishlist item not found" });
    }

    const stock = item.product.stockQuantity;
    if (stock < quantity) {
      return res.status(400).json({
        status: "error",
        message: `Only ${stock} items available`
      });
    }

    const existing = await Cart.findOne({
      where: {
        userId,
        productId: item.productId,
        variantId: variantId || null
      }
    });

    if (existing) {
      const newQty = existing.quantity + quantity;
      if (newQty > stock) {
        return res.status(400).json({
          status: "error",
          message: `Only ${stock - existing.quantity} more can be added`
        });
      }

      existing.quantity = newQty;
      existing.unitPrice = item.product.price;
      await existing.save();
    } else {
      await Cart.create({
        userId,
        productId: item.productId,
        variantId,
        quantity,
        unitPrice: item.product.price
      });
    }

    await item.destroy();

    res.status(200).json({
      status: "success",
      message: "Moved to cart"
    });

  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ status: "error", message: "Internal Server Error" });
  }
};
