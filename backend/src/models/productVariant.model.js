// Product Variant Model
import { DataTypes, Model } from "sequelize";

const ProductVariant = (sequelize) => {
  class ProductVariant extends Model {
    static associate(models) {
      ProductVariant.belongsTo(models.Product, {
        foreignKey: "productId",
        as: "product",
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
      sku: {
        type: DataTypes.STRING(100),
        validate: {
          notEmpty: { msg: "Variant SKU is required" },
        },
      },

      price: {
        type: DataTypes.DECIMAL(10, 2),
        validate: {
          min: { args: 0, msg: "Price cannot be negative" },
        },
      },
      stockQuantity: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        validate: {
          min: { args: 0, msg: "Stock quantity cannot be negative" },
        },
      },
      attributes: DataTypes.JSONB,
      images: {
        type: DataTypes.JSON,
        allowNull: true,
        validate: {
          isValidImage(value) {
            if (!value) return; // allow null

            const { url, height, width, blurhash } = value;

            if (typeof url !== "string" || !/^https?:\/\/.+/.test(url)) {
              throw new Error("Image URL must be a valid URL");
            }

            if (typeof height !== "number" || typeof width !== "number") {
              throw new Error("Image height and width must be numbers");
            }

            if (typeof blurhash !== "string") {
              throw new Error("Image blurhash must be a string");
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
      indexes: [
        {
          unique: true,
          fields: ["productId", "sku"], // enforce uniqueness per product
        },
        {
          fields: ["productId"], // for faster lookup of variants by product
        },
        {
          fields: ["isActive"], // to filter active/inactive variants efficiently
        },
        {
          fields: ["attributes"],
          using: "gin", // for querying/filtering JSONB attributes
        },
      ],
    }
  );

  // Hook to validate and parse fields before saving
  ProductVariant.beforeValidate((variant) => {
    // Trim string fields
    const stringFields = ["sku", "name", "description"];
    stringFields.forEach((field) => {
      if (variant[field] && typeof variant[field] === "string") {
        variant.setDataValue(field, variant[field].trim());
      }
    });

    // Parse numeric fields
    ["price", "comparePrice"].forEach((field) => {
      if (
        variant[field] !== undefined &&
        variant[field] !== null &&
        typeof variant[field] === "string"
      ) {
        const parsed = parseFloat(variant[field]);
        variant.setDataValue(field, isNaN(parsed) ? null : parsed);
      }
    });

    // Parse integer fields
    if (
      variant.stockQuantity !== undefined &&
      variant.stockQuantity !== null &&
      typeof variant.stockQuantity === "string"
    ) {
      const parsed = parseInt(variant.stockQuantity, 10);
      variant.setDataValue("stockQuantity", isNaN(parsed) ? null : parsed);
    }

    // Parse boolean fields
    if (typeof variant.isActive === "string") {
      variant.setDataValue("isActive", variant.isActive === "true");
    }
  });

  return ProductVariant;
};

export default ProductVariant;
