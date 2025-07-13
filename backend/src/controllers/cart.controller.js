import { Cart, Product, ProductVariant } from "../models/index.model.js";
import { handleError } from "../utils/apiError.js";

// Get user's cart

const getCartItems = async (req, res) => {
  try {
    const userId = req.user.id;

    const cartItems = await Cart.findAll({
      where: { userId },
      include: [
        {
          model: Product,
          as: "product",
          attributes: [
            "id",
            "name",
            "slug",
            "images",
            "price",
            "comparePrice",
            "description",
            "shortDescription",
            "stockQuantity",
            "isFeatured",
            "tags",
            "metaTitle",
            "metaDescription",
          ],
          where: { isActive: true },
          required: true,
        },
        {
          model: ProductVariant,
          as: "variant",
          attributes: [
            "id",
            "name",
            "price",
            "stockQuantity",
            "attributes",
            "images",
          ],
          required: false,
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      success: true,
      status: "Cart fetched successfully",
      message: "Cart items fetched successfully",
      data: cartItems,
    });
  } catch (error) {
    handleError(error, res);
  }
};

// Add item to cart
const addCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, variantId = null, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        status: "error",
        message: "Product ID is required",
      });
    }

    // Validate product exists and is active
    const product = await Product.findOne({
      where: {
        id: productId,
        isActive: true,
      },
      include: variantId
        ? [
            {
              model: ProductVariant,
              as: "variants",
              where: {
                id: variantId,
                isActive: true,
              },
              required: true,
            },
          ]
        : [],
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        status: "Error adding to cart",
        message: "Product not found or inactive",
      });
    }

    // If variant specified, validate it
    let variant = null;
    if (variantId) {
      variant = product.variants[0];
      if (!variant) {
        return res.status(404).json({
          success: false,
          status: "error",
          message: "Product variant not found",
        });
      }
    }

    // Check stock availability
    const availableStock = variant
      ? variant.stockQuantity
      : product.stockQuantity;
    if (availableStock < quantity) {
      return res.status(400).json({
        status: "error",
        message: `Only ${availableStock} items available in stock`,
      });
    }

    // Check if item already exists in cart
    const existingCartItem = await Cart.findOne({
      where: {
        userId,
        productId,
        variantId: variantId || null,
      },
    });

    let cartItem;

    if (existingCartItem) {
      // Update existing cart item
      const newQuantity = existingCartItem.quantity + quantity;

      if (newQuantity > availableStock) {
        return res.status(400).json({
          status: "error",
          message: `Cannot add ${quantity} items. Only ${
            availableStock - existingCartItem.quantity
          } more available`,
        });
      }

      existingCartItem.quantity = newQuantity;

      cartItem = await existingCartItem.save();
    } else {
      // Create new cart item
      cartItem = await Cart.create({
        userId,
        productId,
        variantId,
        quantity,
      });
    }

    const cartItems = await Cart.findAll({
      where: { userId },
      include: [
        {
          model: Product,
          as: "product",
          attributes: [
            "id",
            "name",
            "slug",
            "images",
            "price",
            "comparePrice",
            "description",
            "shortDescription",
            "stockQuantity",
            "isFeatured",
            "tags",
            "metaTitle",
            "metaDescription",
          ],
          where: { isActive: true },
          required: true,
        },
        {
          model: ProductVariant,
          as: "variant",
          attributes: [
            "id",
            "name",
            "price",
            "stockQuantity",
            "attributes",
            "images",
          ],
          required: false,
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.status(201).json({
      status: "success",
      message: "Item added to cart successfully",
      data: cartItems,
    });
  } catch (error) {
    handleError(error, res);
  }
};

// Update cart item quantity
const updateCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { cartItemId } = req.params;

    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({
        status: "error",
        message: "Quantity must be at least 1",
      });
    }

    const cartItem = await Cart.findOne({
      where: {
        id: cartItemId,
        userId,
      },
      include: [
        {
          model: Product,
          as: "product",
          attributes: ["stockQuantity", "isActive"],
        },
        {
          model: ProductVariant,
          as: "variant",
          attributes: ["stockQuantity"],
          required: false,
        },
      ],
    });

    if (!cartItem) {
      return res.status(404).json({
        status: "error",
        message: "Cart item not found",
      });
    }

    if (!cartItem.product.isActive) {
      return res.status(400).json({
        success: false,
        status: "Error Updating Quantity",
        message: "Product is no longer available",
      });
    }

    // Check stock availability
    const availableStock = cartItem.variant
      ? cartItem.variant.stockQuantity
      : cartItem.product.stockQuantity;

    if (quantity > availableStock) {
      return res.status(400).json({
        success: false,
        status: "Error updating quantity",
        message: `Only ${availableStock} items available in stock`,
      });
    }

    cartItem.quantity = quantity;
    await cartItem.save();

    res.status(200).json({
      success: true,
      status: "success",
      message: "Cart item updated successfully",
    });
  } catch (error) {
    console.error("Error updating cart item:", error);
    res.status(500).json({
      success: false,
      status: "Error updating quantity",
      message: error.message || "Internal Server Error",
    });
  }
};

// Remove item from cart
const removeCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { cartItemId } = req.params;

    const cartItem = await Cart.findOne({
      where: {
        id: cartItemId,
        userId,
      },
    });

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        status: "Error deleting cart item",
        message: "Cart item not found",
      });
    }

    await cartItem.destroy();

    res.status(200).json({
      success: true,
      status: "Item Deleted Successfullt",
      message: "Item removed from cart successfully",
    });
  } catch (error) {
    console.error("Error removing cart item:", error);
    res.status(500).json({
      success: false,
      status: "Error deleting cart item",
      message: error.message || "Internal Server Error",
    });
  }
};


export {
  getCartItems,
  addCart,
  updateCart,
  removeCartItem,
};
