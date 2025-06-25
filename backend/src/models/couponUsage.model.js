// Coupon Usage Model
const { DataTypes, Model } = require('sequelize');
const CouponUsage = (sequelize) => {
  class CouponUsage extends Model {
    static associate(models) {
      CouponUsage.belongsTo(models.Coupon, { foreignKey: 'couponId', as: 'coupon' });
      CouponUsage.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
      CouponUsage.belongsTo(models.Order, { foreignKey: 'orderId', as: 'order' });
    }
  }

  CouponUsage.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    couponId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'coupons', key: 'id' }
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' }
    },
    orderId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'orders', key: 'id' }
    },
    discountAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: { args: 0, msg: 'Discount amount cannot be negative' }
      }
    }
  }, {
    sequelize,
    modelName: 'CouponUsage',
    tableName: 'coupon_usages',
    timestamps: true,
    indexes: [
      { fields: ['couponId'] },
      { fields: ['userId'] },
      { fields: ['orderId'] },
      { unique: true, fields: ['couponId', 'orderId'] }
    ]
  });

  return CouponUsage;
};

module.exports = CouponUsage;