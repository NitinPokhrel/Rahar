// models/OrderCoupon.js
import { DataTypes, Model } from "sequelize";

const OrderCoupon = (sequelize) => {
  class OrderCoupon extends Model {
    static associate(models) {
      OrderCoupon.belongsTo(models.Order, { foreignKey: "orderId" });
      OrderCoupon.belongsTo(models.Coupon, { foreignKey: "couponId" });
    }
  }

  OrderCoupon.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      orderId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: "orders", key: "id" },
      },
      couponId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: "coupons", key: "id" },
      },
    },
    {
      sequelize,
      modelName: "OrderCoupon",
      tableName: "order_coupons",
      timestamps: true,
    }
  );

  return OrderCoupon;
};

export default OrderCoupon;
