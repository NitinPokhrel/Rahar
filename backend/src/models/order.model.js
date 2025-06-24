// Order Model
const { DataTypes, Model } = require('sequelize');
const Order = (sequelize) => {
  class Order extends Model {
    static associate(models) {
      Order.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
      Order.belongsTo(models.Address, { foreignKey: 'shippingAddressId', as: 'shippingAddress' });
      Order.belongsTo(models.Address, { foreignKey: 'billingAddressId', as: 'billingAddress' });
      Order.belongsTo(models.Coupon, { foreignKey: 'couponId', as: 'coupon' });
      Order.hasMany(models.OrderItem, { foreignKey: 'orderId', as: 'items' });
      Order.hasMany(models.OrderStatusHistory, { foreignKey: 'orderId', as: 'statusHistory' });
    }
  }

  Order.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    orderNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: { msg: 'Order number must be unique' }
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' }
    },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'),
      defaultValue: 'pending',
      allowNull: false
    },
    paymentStatus: {
      type: DataTypes.ENUM('pending', 'paid', 'failed', 'refunded', 'partially_refunded'),
      defaultValue: 'pending',
      allowNull: false
    },
    paymentMethod: {
      type: DataTypes.ENUM('stripe', 'qr_bank', 'cash_on_delivery'),
      allowNull: false
    },
    paymentIntentId: DataTypes.STRING(100), // Stripe payment intent ID
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: { args: 0, msg: 'Subtotal cannot be negative' }
      }
    },
    taxAmount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      validate: {
        min: { args: 0, msg: 'Tax amount cannot be negative' }
      }
    },
    shippingAmount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      validate: {
        min: { args: 0, msg: 'Shipping amount cannot be negative' }
      }
    },
    discountAmount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      validate: {
        min: { args: 0, msg: 'Discount amount cannot be negative' }
      }
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: { args: 0, msg: 'Total amount cannot be negative' }
      }
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'NPR',
      validate: {
        len: { args: [3, 3], msg: 'Currency must be 3 characters' }
      }
    },
    couponId: {
      type: DataTypes.UUID,
      references: { model: 'coupons', key: 'id' }
    },
    shippingAddressId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'addresses', key: 'id' }
    },
    billingAddressId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'addresses', key: 'id' }
    },
    notes: DataTypes.TEXT,
    trackingNumber: DataTypes.STRING(100),
    shippedAt: DataTypes.DATE,
    deliveredAt: DataTypes.DATE,
    cancelledAt: DataTypes.DATE,
    cancellationReason: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'Order',
    tableName: 'orders',
    timestamps: true,
    indexes: [
      { fields: ['orderNumber'] },
      { fields: ['userId'] },
      { fields: ['status'] },
      { fields: ['paymentStatus'] },
      { fields: ['couponId'] },
      { fields: ['createdAt'] }
    ]
  });

  return Order;
};
module.exports = Order;