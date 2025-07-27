// Product Variant Model
import { DataTypes, Model } from "sequelize";

const ProductVariant = (sequelize) => {
  class ProductVariant extends Model {
    static associate(models) {
      ProductVariant.belongsTo(models.Product, {
        foreignKey: "productId",
        as: "product",
      });
      
      // Self-referencing association for variant relationships (e.g., parent-child variants)
      ProductVariant.belongsTo(models.ProductVariant, {
        foreignKey: "variantId",
        as: "parentVariant",
      });
      
      ProductVariant.hasMany(models.ProductVariant, {
        foreignKey: "variantId",
        as: "childVariants",
      });
      
      ProductVariant.hasMany(models.Cart, {
        foreignKey: "variantId",
        as: "cartItems",
      });
      
      ProductVariant.hasMany(models.OrderItem, {
        foreignKey: "variantId",
        as: "orderItems",
      });
    }
  }

  ProductVariant.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      productId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: "products", key: "id" },
      },

      // variantId: {
      //   type: DataTypes.UUID,
      //   allowNull: true, // Should be nullable for top-level variants
      //   references: { model: "product_variants", key: "id" }, // Fixed table name
      // },

      
      sku: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
          notEmpty: { msg: "Variant SKU is required" },
        },
      },
      name: {
        type: DataTypes.STRING(200),
        allowNull: false,
        validate: {
          notEmpty: { msg: "Product name is required" },
          len: {
            args: [2, 200],
            msg: "Product name must be between 2-200 characters",
          },
        },
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        validate: {
          min: { args: [0], msg: "Price cannot be negative" },
        },
      },
      comparePrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      stockQuantity: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        validate: {
          min: { args: [0], msg: "Stock quantity cannot be negative" },
        },
      },
      attributes: DataTypes.JSONB,
      images: {
        type: DataTypes.JSON,
        allowNull: true,
        validate: {
          isValidImage(value) {
            if (!value) return;

            const { url, height, width, blurhash } = value;

            if (typeof url !== "string" || !/^https?:\/\/.+/.test(url)) {
              throw new Error("Image URL must be a valid URL");
            }

            if (typeof height !== "number" || typeof width !== "number") {
              throw new Error("Image height and width must be numbers");
            }

            if (blurhash !== null && typeof blurhash !== "string") {
              throw new Error("Image blurhash must be a string or null");
            }
          },
        },
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      sequelize,
      modelName: "ProductVariant",
      tableName: "product_variants",
      timestamps: true,
      paranoid: true, 
      
      indexes: [
        {
          unique: true,
          fields: ["productId", "sku"],
        },
        {
          fields: ["productId"],
        },
        // {
        //   // fields: ["variantId"], // Add index for self-reference
        // },
        {
          fields: ["isActive"],
        },
        {
          fields: ["attributes"],
          using: "gin",
        },
      ],
    }
  );

  // --- Data sanitization before validation ---
  ProductVariant.beforeValidate((variant) => {
    // Trim string fields
    const stringFields = ["sku", "name", "description"];
    for (const field of stringFields) {
      if (typeof variant[field] === "string") {
        variant.setDataValue(field, variant[field].trim());
      }
    }

    // Sanitize price and comparePrice
    ["price", "comparePrice"].forEach((field) => {
      if (variant[field] !== undefined && variant[field] !== null) {
        const parsed = parseFloat(variant[field]);
        variant.setDataValue(field, isNaN(parsed) || parsed < 0 ? 0 : parsed);
      }
    });

    // Sanitize stock quantity
    if (variant.stockQuantity !== undefined && variant.stockQuantity !== null) {
      const parsed = parseInt(variant.stockQuantity, 10);
      variant.setDataValue(
        "stockQuantity",
        isNaN(parsed) || parsed < 0 ? 0 : parsed
      );
    }

    // Sanitize isActive (form-data sends boolean as string)
    if (typeof variant.isActive === "string") {
      variant.setDataValue("isActive", variant.isActive === "true");
    }
  });

  return ProductVariant;
};

export default ProductVariant;