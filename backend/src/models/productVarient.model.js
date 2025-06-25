// Product Variant Model
const { DataTypes, Model } = require('sequelize');

const ProductVariant = (sequelize) => {
  class ProductVariant extends Model {
    static associate(models) {
      ProductVariant.belongsTo(models.Product, { foreignKey: 'productId', as: 'product' });
      ProductVariant.hasMany(models.Cart, { foreignKey: 'variantId', as: 'cartItems' });
      ProductVariant.hasMany(models.OrderItem, { foreignKey: 'variantId', as: 'orderItems' });
    }
  }

  ProductVariant.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    productId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'products', key: 'id' }
    },
    sku: {
      type: DataTypes.STRING(100),
      unique: { msg: 'Variant SKU must be unique' },
      validate: {
        notEmpty: { msg: 'Variant SKU is required' }
      }
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Variant name is required' }
      }
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      validate: {
        min: { args: 0, msg: 'Price cannot be negative' }
      }
    },
    comparePrice: {
      type: DataTypes.DECIMAL(10, 2),
      validate: {
        min: { args: 0, msg: 'Compare price cannot be negative' }
      }
    },
    stockQuantity: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: { args: 0, msg: 'Stock quantity cannot be negative' }
      }
    },
    attributes: DataTypes.JSONB, // {size: 'L', color: 'Red', material: 'Cotton'}
    weight: {
      type: DataTypes.DECIMAL(8, 2),
      validate: {
        min: { args: 0, msg: 'Weight cannot be negative' }
      }
    },
    image: {
      type: DataTypes.TEXT,
      validate: {
        isUrl: { msg: 'Image must be a valid URL' }
      }
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    sequelize,
    modelName: 'ProductVariant',
    tableName: 'product_variants',
    timestamps: true,
    indexes: [
      { fields: ['productId'] },
      { fields: ['sku'] },
      { fields: ['isActive'] },
      { fields: ['attributes'], using: 'gin' }
    ]
  });

  return ProductVariant;
};

module.exports = ProductVariant;