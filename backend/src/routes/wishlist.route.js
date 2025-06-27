import { Router } from "express";
import { Wishlist, Product, Category } from "../models/index.model.js";

const router = Router();

// Get user's wishlist
router.get("/", async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 12 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows: wishlistItems } = await Wishlist.findAndCountAll({
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
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      status: "success",
      data: {
        wishlistItems,
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
    console.error("Error fetching wishlist:", error);
    res.status(500).json({ 
      status: "error",
      message: "Internal Server Error" 
    });
  }
});

// Add product to wishlist
router.post("/add", async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({
        status: "error",
        message: "Product ID is required"
      });
    }

    // Validate product exists and is active
    const product = await Product.findOne({
      where: { 
        id: productId,
        isActive: true 
      }
    });

    if (!product) {
      return res.status(404).json({
        status: "error",
        message: "Product not found or inactive"
      });
    }

    // Check if product is already in wishlist
    const existingWishlistItem = await Wishlist.findOne({
      where: {
        userId,
        productId
      }
    });

    if (existingWishlistItem) {
      return res.status(400).json({
        status: "error",
        message: "Product is already in your wishlist"
      });
    }

    // Add to wishlist
    const wishlistItem = await Wishlist.create({
      userId,
      productId
    });

    // Fetch the complete wishlist item with product details
    const completeWishlistItem = await Wishlist.findByPk(wishlistItem.id, {
      include: [
        {
          model: Product,
          as: "product",
          attributes: [
            "id", "name", "slug", "images", "price", "comparePrice",
            "stockQuantity", "isActive", "isFeatured"
          ],
          include: [
            {
              model: Category,
              as: "category",
              attributes: ["id", "name", "slug"]
            }
          ]
        }
      ]
    });

    res.status(201).json({
      status: "success",
      message: "Product added to wishlist successfully",
      data: { wishlistItem: completeWishlistItem }
    });

  } catch (error) {
    console.error("Error adding to wishlist:", error);
    res.status(500).json({ 
      status: "error",
      message: "Internal Server Error" 
    });
  }
});

// Remove product from wishlist
router.delete("/:wishlistItemId", async (req, res) => {
  try {
    const userId = req.user.id;
    const { wishlistItemId } = req.params;

    const wishlistItem = await Wishlist.findOne({
      where: { 
        id: wishlistItemId,
        userId 
      }
    });

    if (!wishlistItem) {
      return res.status(404).json({
        status: "error",
        message: "Wishlist item not found"
      });
    }

    await wishlistItem.destroy();

    res.status(200).json({
      status: "success",
      message: "Product removed from wishlist successfully"
    });

  } catch (error) {
    console.error("Error removing from wishlist:", error);
    res.status(500).json({ 
      status: "error",
      message: "Internal Server Error" 
    });
  }
});

// Remove product from wishlist by product ID (alternative endpoint)
router.delete("/product/:productId", async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    const wishlistItem = await Wishlist.findOne({
      where: { 
        productId,
        userId 
      }
    });

    if (!wishlistItem) {
      return res.status(404).json({
        status: "error",
        message: "Product not found in wishlist"
      });
    }

    await wishlistItem.destroy();

    res.status(200).json({
      status: "success",
      message: "Product removed from wishlist successfully"
    });

  } catch (error) {
    console.error("Error removing from wishlist:", error);
    res.status(500).json({ 
      status: "error",
      message: "Internal Server Error" 
    });
  }
});

// Clear entire wishlist
router.delete("/", async (req, res) => {
  try {
    const userId = req.user.id;

    await Wishlist.destroy({
      where: { userId }
    });

    res.status(200).json({
      status: "success",
      message: "Wishlist cleared successfully"
    });

  } catch (error) {
    console.error("Error clearing wishlist:", error);
    res.status(500).json({ 
      status: "error",
      message: "Internal Server Error" 
    });
  }
});

// Check if product is in wishlist
router.get("/check/:productId", async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    const wishlistItem = await Wishlist.findOne({
      where: {
        userId,
        productId
      }
    });

    res.status(200).json({
      status: "success",
      data: {
        inWishlist: !!wishlistItem,
        wishlistItemId: wishlistItem?.id || null
      }
    });

  } catch (error) {
    console.error("Error checking wishlist:", error);
    res.status(500).json({ 
      status: "error",
      message: "Internal Server Error" 
    });
  }
});

// Get wishlist count
router.get("/count", async (req, res) => {
  try {
    const userId = req.user.id;

    const count = await Wishlist.count({
      where: { userId },
      include: [
        {
          model: Product,
          as: "product",
          where: { isActive: true },
          required: true
        }
      ]
    });

    res.status(200).json({
      status: "success",
      data: { count }
    });

  } catch (error) {
    console.error("Error getting wishlist count:", error);
    res.status(500).json({ 
      status: "error",
      message: "Internal Server Error" 
    });
  }
});

// Move wishlist item to cart
router.post("/:wishlistItemId/move-to-cart", async (req, res) => {
  try {
    const userId = req.user.id;
    const { wishlistItemId } = req.params;
    const { quantity = 1, variantId = null } = req.body;

    const wishlistItem = await Wishlist.findOne({
      where: { 
        id: wishlistItemId,
        userId 
      },
      include: [
        {
          model: Product,
          as: "product",
          where: { isActive: true },
          required: true
        }
      ]
    });

    if (!wishlistItem) {
      return res.status(404).json({
        status: "error",
        message: "Wishlist item not found"
      });
    }

    // Check stock availability
    const availableStock = wishlistItem.product.stockQuantity;
    if (availableStock < quantity) {
      return res.status(400).json({
        status: "error",
        message: `Only ${availableStock} items available in stock`
      });
    }

    // Check if item already exists in cart
    const existingCartItem = await Cart.findOne({
      where: {
        userId,
        productId: wishlistItem.productId,
        variantId: variantId || null
      }
    });

    if (existingCartItem) {
      // Update existing cart item
      const newQuantity = existingCartItem.quantity + quantity;
      
      if (newQuantity > availableStock) {
        return res.status(400).json({
          status: "error",
          message: `Cannot add ${quantity} items. Only ${availableStock - existingCartItem.quantity} more available`
        });
      }

      existingCartItem.quantity = newQuantity;
      existingCartItem.unitPrice = wishlistItem.product.price;
      await existingCartItem.save();
    } else {
      // Create new cart item
      await Cart.create({
        userId,
        productId: wishlistItem.productId,
        variantId,
        quantity,
        unitPrice: wishlistItem.product.price
      });
    }

    // Remove from wishlist
    await wishlistItem.destroy();

    res.status(200).json({
      status: "success",
      message: "Product moved to cart successfully"
    });

  } catch (error) {
    console.error("Error moving to cart:", error);
    res.status(500).json({ 
      status: "error",
      message: "Internal Server Error" 
    });
  }
});

export default router;