// Order Status History Model
const { DataTypes, Model } = require('sequelize');
const OrderStatusHistory = (sequelize) => {
  class OrderStatusHistory extends Model {
    static associate(models) {
      OrderStatusHistory.belongsTo(models.Order, { foreignKey: 'orderId', as: 'order' });
      OrderStatusHistory.belongsTo(models.User, { foreignKey: 'updatedBy', as: 'updater' });
    }
  }

  OrderStatusHistory.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    orderId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'orders', key: 'id' }
    },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'),
      allowNull: false
    },
    notes: DataTypes.TEXT,
    updatedBy: {
      type: DataTypes.UUID,
      references: { model: 'users', key: 'id' }
    }
  }, {
    sequelize,
    modelName: 'OrderStatusHistory',
    tableName: 'order_status_history',
    timestamps: true,
    indexes: [
      { fields: ['orderId'] },
      { fields: ['status'] },
      { fields: ['createdAt'] }
    ]
  });

  return OrderStatusHistory;
};

module.exports = OrderStatusHistory;