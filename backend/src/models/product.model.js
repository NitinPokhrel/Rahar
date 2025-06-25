// Product Model
const { DataTypes, Model } = require('sequelize');
const Product = (sequelize) => {
  class Product extends Model {
    static associate(models) {
      Product.belongsTo(models.Category, { foreignKey: 'categoryId', as: 'category' });
      Product.hasMany(models.ProductVariant, { foreignKey: 'productId', as: 'variants' });
      Product.hasMany(models.ProductImage, { foreignKey: 'productId', as: 'images' });
      Product.hasMany(models.Review, { foreignKey: 'productId', as: 'reviews' });
      Product.hasMany(models.Cart, { foreignKey: 'productId', as: 'cartItems' });
      Product.hasMany(models.OrderItem, { foreignKey: 'productId', as: 'orderItems' });
      Product.hasMany(models.Wishlist, { foreignKey: 'productId', as: 'wishlistItems' });
    }
  }

  Product.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Product name is required' },
        len: { args: [2, 200], msg: 'Product name must be between 2-200 characters' }
      }
    },
    slug: {
      type: DataTypes.STRING(250),
      allowNull: false,
      unique: { msg: 'Product slug must be unique' },
      validate: {
        is: { args: /^[a-z0-9-]+$/, msg: 'Slug must contain only lowercase letters, numbers, and hyphens' }
      }
    },
    description: {
      type: DataTypes.TEXT,
      validate: {
        len: { args: [0, 5000], msg: 'Description cannot exceed 5000 characters' }
      }
    },
    shortDescription: {
      type: DataTypes.TEXT,
      validate: {
        len: { args: [0, 500], msg: 'Short description cannot exceed 500 characters' }
      }
    },
    sku: {
      type: DataTypes.STRING(100),
      unique: { msg: 'SKU must be unique' },
      validate: {
        notEmpty: { msg: 'SKU is required' }
      }
    },
    categoryId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'categories', key: 'id' }
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: { args: 0, msg: 'Price cannot be negative' },
        isDecimal: { msg: 'Price must be a valid decimal number' }
      }
    },
    comparePrice: {
      type: DataTypes.DECIMAL(10, 2),
      validate: {
        min: { args: 0, msg: 'Compare price cannot be negative' },
        isDecimal: { msg: 'Compare price must be a valid decimal number' }
      }
    },
    costPrice: {
      type: DataTypes.DECIMAL(10, 2),
      validate: {
        min: { args: 0, msg: 'Cost price cannot be negative' },
        isDecimal: { msg: 'Cost price must be a valid decimal number' }
      }
    },
    stockQuantity: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: { args: 0, msg: 'Stock quantity cannot be negative' }
      }
    },
    lowStockThreshold: {
      type: DataTypes.INTEGER,
      defaultValue: 5,
      validate: {
        min: { args: 0, msg: 'Low stock threshold cannot be negative' }
      }
    },
    trackQuantity: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    allowBackorder: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    weight: {
      type: DataTypes.DECIMAL(8, 2),
      validate: {
        min: { args: 0, msg: 'Weight cannot be negative' }
      }
    },
    dimensions: DataTypes.JSONB, // {length, width, height}
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    isFeatured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    metaTitle: DataTypes.STRING(200),
    metaDescription: {
      type: DataTypes.TEXT,
      validate: {
        len: { args: [0, 500], msg: 'Meta description cannot exceed 500 characters' }
      }
    },
    averageRating: {
      type: DataTypes.DECIMAL(3, 2),
      defaultValue: 0,
      validate: {
        min: { args: 0, msg: 'Rating cannot be negative' },
        max: { args: 5, msg: 'Rating cannot exceed 5' }
      }
    },
    reviewCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: { args: 0, msg: 'Review count cannot be negative' }
      }
    },
    viewCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: { args: 0, msg: 'View count cannot be negative' }
      }
    }
  }, {
    sequelize,
    modelName: 'Product',
    tableName: 'products',
    timestamps: true,
    paranoid: true,
    indexes: [
      { fields: ['slug'] },
      { fields: ['sku'] },
      { fields: ['categoryId'] },
      { fields: ['isActive'] },
      { fields: ['isFeatured'] },
      { fields: ['price'] },
      { fields: ['stockQuantity'] },
      { fields: ['averageRating'] },
      { fields: ['tags'], using: 'gin' }
    ]
  });

  return Product;
};
module.exports = Product;