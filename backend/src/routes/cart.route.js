import { Router } from "express";
import { Cart, Product, ProductVariant } from "../models/index.model.js";


const router = Router();

// Get user's cart
router.get("/", async (req, res) => {
  try {
    const userId = req.user.id;

    const cartItems = await Cart.findAll({
      where: { userId },
      include: [
        {
          model: Product,
          as: "product",
          attributes: ["id", "name", "slug", "images", "price", "stockQuantity", "isActive"],
          where: { isActive: true },
          required: true
        },
        {
          model: ProductVariant,
          as: "variant",
          attributes: ["id", "name", "price", "comparePrice", "stockQuantity", "attributes", "images"],
          required: false
        }
      ],
      order: [["createdAt", "DESC"]]
    });

    // Calculate totals
    let subtotal = 0;
    let totalItems = 0;

    const validCartItems = cartItems.filter(item => {
      if (!item.product.isActive) return false;
      
      const itemPrice = item.variant ? item.variant.price || item.product.price : item.product.price;
      const availableStock = item.variant ? item.variant.stockQuantity : item.product.stockQuantity;
      
      // Check if item is still in stock
      if (availableStock < item.quantity) {
        // Update quantity to available stock if oversold
        item.quantity = Math.max(0, availableStock);
        item.save();
      }
      
      if (item.quantity > 0) {
        subtotal += parseFloat(itemPrice) * item.quantity;
        totalItems += item.quantity;
        return true;
      }
      
      return false;
    });

    res.status(200).json({
      status: "success",
      data: {
        cartItems: validCartItems,
        summary: {
          subtotal: parseFloat(subtotal.toFixed(2)),
          totalItems,
          itemCount: validCartItems.length
        }
      }
    });

  } catch (error) {
    console.error("Error fetching cart:", error);
    res.status(500).json({ 
      status: "error",
      message: "Internal Server Error" 
    });
  }
});

// Add item to cart
router.post("/add", async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, variantId = null, quantity = 1 } = req.body;

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
      },
      include: variantId ? [
        {
          model: ProductVariant,
          as: "variants",
          where: { 
            id: variantId,
            isActive: true 
          },
          required: true
        }
      ] : []
    });

    if (!product) {
      return res.status(404).json({
        status: "error",
        message: "Product not found or inactive"
      });
    }

    // If variant specified, validate it
    let variant = null;
    if (variantId) {
      variant = product.variants[0];
      if (!variant) {
        return res.status(404).json({
          status: "error",
          message: "Product variant not found"
        });
      }
    }

    // Check stock availability
    const availableStock = variant ? variant.stockQuantity : product.stockQuantity;
    if (availableStock < quantity) {
      return res.status(400).json({
        status: "error",
        message: `Only ${availableStock} items available in stock`
      });
    }

    // Get the current price
    const unitPrice = variant ? (variant.price || product.price) : product.price;

    // Check if item already exists in cart
    const existingCartItem = await Cart.findOne({
      where: {
        userId,
        productId,
        variantId: variantId || null
      }
    });

    let cartItem;

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
      existingCartItem.unitPrice = unitPrice; // Update price in case it changed
      cartItem = await existingCartItem.save();
    } else {
      // Create new cart item
      cartItem = await Cart.create({
        userId,
        productId,
        variantId,
        quantity,
        unitPrice
      });
    }

    // Fetch the complete cart item with associations
    const completeCartItem = await Cart.findByPk(cartItem.id, {
      include: [
        {
          model: Product,
          as: "product",
          attributes: ["id", "name", "slug", "images"]
        },
        {
          model: ProductVariant,
          as: "variant",
          attributes: ["id", "name", "images", "attributes"],
          required: false
        }
      ]
    });

    res.status(201).json({
      status: "success",
      message: "Item added to cart successfully",
      data: { cartItem: completeCartItem }
    });

  } catch (error) {
    console.error("Error adding to cart:", error);
    res.status(500).json({ 
      status: "error",
      message: "Internal Server Error" 
    });
  }
});

// Update cart item quantity
router.put("/:cartItemId", async (req, res) => {
  try {
    const userId = req.user.id;
    const { cartItemId } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({
        status: "error",
        message: "Quantity must be at least 1"
      });
    }

    const cartItem = await Cart.findOne({
      where: { 
        id: cartItemId,
        userId 
      },
      include: [
        {
          model: Product,
          as: "product",
          attributes: ["stockQuantity", "isActive"]
        },
        {
          model: ProductVariant,
          as: "variant",
          attributes: ["stockQuantity"],
          required: false
        }
      ]
    });

    if (!cartItem) {
      return res.status(404).json({
        status: "error",
        message: "Cart item not found"
      });
    }

    if (!cartItem.product.isActive) {
      return res.status(400).json({
        status: "error",
        message: "Product is no longer available"
      });
    }

    // Check stock availability
    const availableStock = cartItem.variant ? 
      cartItem.variant.stockQuantity : 
      cartItem.product.stockQuantity;

    if (quantity > availableStock) {
      return res.status(400).json({
        status: "error",
        message: `Only ${availableStock} items available in stock`
      });
    }

    cartItem.quantity = quantity;
    await cartItem.save();

    res.status(200).json({
      status: "success",
      message: "Cart item updated successfully",
      data: { cartItem }
    });

  } catch (error) {
    console.error("Error updating cart item:", error);
    res.status(500).json({ 
      status: "error",
      message: "Internal Server Error" 
    });
  }
});

// Remove item from cart
router.delete("/:cartItemId", async (req, res) => {
  try {
    const userId = req.user.id;
    const { cartItemId } = req.params;

    const cartItem = await Cart.findOne({
      where: { 
        id: cartItemId,
        userId 
      }
    });

    if (!cartItem) {
      return res.status(404).json({
        status: "error",
        message: "Cart item not found"
      });
    }

    await cartItem.destroy();

    res.status(200).json({
      status: "success",
      message: "Item removed from cart successfully"
    });

  } catch (error) {
    console.error("Error removing cart item:", error);
    res.status(500).json({ 
      status: "error",
      message: "Internal Server Error" 
    });
  }
});

// Clear entire cart
router.delete("/", async (req, res) => {
  try {
    const userId = req.user.id;

    await Cart.destroy({
      where: { userId }
    });

    res.status(200).json({
      status: "success",
      message: "Cart cleared successfully"
    });

  } catch (error) {
    console.error("Error clearing cart:", error);
    res.status(500).json({ 
      status: "error",
      message: "Internal Server Error" 
    });
  }
});

// Get cart summary (item count and total)
router.get("/summary", async (req, res) => {
  try {
    const userId = req.user.id;

    const cartItems = await Cart.findAll({
      where: { userId },
      include: [
        {
          model: Product,
          as: "product",
          attributes: ["price", "isActive"],
          where: { isActive: true },
          required: true
        },
        {
          model: ProductVariant,
          as: "variant",
          attributes: ["price"],
          required: false
        }
      ]
    });

    let subtotal = 0;
    let totalItems = 0;

    cartItems.forEach(item => {
      const itemPrice = item.variant ? 
        (item.variant.price || item.product.price) : 
        item.product.price;
      
      subtotal += parseFloat(itemPrice) * item.quantity;
      totalItems += item.quantity;
    });

    res.status(200).json({
      status: "success",
      data: {
        summary: {
          subtotal: parseFloat(subtotal.toFixed(2)),
          totalItems,
          itemCount: cartItems.length
        }
      }
    });

  } catch (error) {
    console.error("Error fetching cart summary:", error);
    res.status(500).json({ 
      status: "error",
      message: "Internal Server Error" 
    });
  }
});

export default router;