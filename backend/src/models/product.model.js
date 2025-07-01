import { DataTypes, Model } from "sequelize";

const Product = (sequelize) => {
  class Product extends Model {
    static associate(models) {
      Product.belongsTo(models.Category, { foreignKey: "categoryId", as: "category" });
      Product.hasMany(models.ProductVariant, { foreignKey: "productId", as: "variants" });
      Product.hasMany(models.Review, { foreignKey: "productId", as: "reviews" });
      Product.hasMany(models.Cart, { foreignKey: "productId", as: "cartItems" });
      Product.hasMany(models.OrderItem, { foreignKey: "productId", as: "orderItems" });
      Product.hasMany(models.Wishlist, { foreignKey: "productId", as: "wishlistItems" });
    }
  }

  Product.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
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
      images: {
        type: DataTypes.JSON,
        allowNull: true,
        validate: {
          isValidImage(value) {
            if (!value || !Array.isArray(value)) return;

            for (const img of value) {
              const { url, height, width, blurhash, public_id } = img;

              if (typeof url !== "string" || !/^https?:\/\/.+/.test(url)) {
                throw new Error("Image URL must be a valid URL");
              }
              if (typeof height !== "number" || typeof width !== "number") {
                throw new Error("Image height and width must be numbers");
              }
              if (typeof blurhash !== "string") {
                throw new Error("Image blurhash must be a string");
              }
              if (typeof public_id !== "string" || public_id.trim() === "") {
                throw new Error("Image public_id must be a non-empty string");
              }
            }
          },
        },
      },

      slug: {
        type: DataTypes.STRING(250),
        allowNull: false,
        unique: { msg: "Product slug must be unique" },
        validate: {
          is: {
            args: /^[a-z0-9-]+$/,
            msg: "Slug must contain only lowercase letters, numbers, and hyphens",
          },
        },
      },
      description: {
        type: DataTypes.TEXT,
        validate: {
          len: {
            args: [0, 5000],
            msg: "Description cannot exceed 5000 characters",
          },
        },
      },
      shortDescription: {
        type: DataTypes.TEXT,
        validate: {
          len: {
            args: [0, 500],
            msg: "Short description cannot exceed 500 characters",
          },
        },
      },
      sku: {
        type: DataTypes.STRING(100),
        unique: { msg: "SKU must be unique" },
        validate: { notEmpty: { msg: "SKU is required" } },
      },
      categoryId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: "categories", key: "id" },
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          min: { args: [0], msg: "Price cannot be negative" },
          isDecimal: { msg: "Price must be a valid decimal number" },
        },
      },
      comparePrice: {
        type: DataTypes.DECIMAL(10, 2),
        validate: {
          min: { args: [0], msg: "Compare price cannot be negative" },
          isDecimal: { msg: "Compare price must be a valid decimal number" },
        },
      },
      costPrice: {
        type: DataTypes.DECIMAL(10, 2),
        validate: {
          min: { args: [0], msg: "Cost price cannot be negative" },
          isDecimal: { msg: "Cost price must be a valid decimal number" },
        },
      },
      stockQuantity: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        validate: {
          min: { args: [0], msg: "Stock quantity cannot be negative" },
        },
      },
      lowStockThreshold: {
        type: DataTypes.INTEGER,
        defaultValue: 5,
        validate: {
          min: { args: [0], msg: "Low stock threshold cannot be negative" },
        },
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      isFeatured: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      tags: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: [],
      },
      metaTitle: DataTypes.STRING(200),
      metaDescription: {
        type: DataTypes.TEXT,
        validate: {
          len: {
            args: [0, 500],
            msg: "Meta description cannot exceed 500 characters",
          },
        },
      },
    },
    {
      sequelize,
      modelName: "Product",
      tableName: "products",
      timestamps: true,
      paranoid: true,
      indexes: [
        { fields: ["slug"] },
        { fields: ["sku"] },
        { fields: ["categoryId"] },
        { fields: ["isActive"] },
        { fields: ["isFeatured"] },
        { fields: ["price"] },
        { fields: ["stockQuantity"] },
        { fields: ["tags"], using: "gin" },
      ],
    }
  );

  // Hook to validate and parse fields before saving
  Product.beforeValidate((product) => {
 

    ["price", "comparePrice", "costPrice"].forEach((field) => {
      if (product[field] !== undefined && product[field] !== null && typeof product[field] === "string") {
        const parsed = parseFloat(product[field]);
        product.setDataValue(field, isNaN(parsed) ? null : parsed);
      }
    });

    ["stockQuantity", "lowStockThreshold"].forEach((field) => {
      if (product[field] !== undefined && product[field] !== null && typeof product[field] === "string") {
        const parsed = parseInt(product[field], 10);
        product.setDataValue(field, isNaN(parsed) ? null : parsed);
      }
    });

    if (typeof product.isActive === "string") {
      product.setDataValue("isActive", product.isActive === "true");
    }

    if (typeof product.isFeatured === "string") {
      product.setDataValue("isFeatured", product.isFeatured === "true");
    }

    if (typeof product.tags === "string") {
      product.setDataValue("tags", product.tags.split(",").map((t) => t.trim()));
    }
  });

  return Product;
};

export default Product;
