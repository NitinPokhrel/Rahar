// models/CouponUsage.js
// coupons and track their usage by users 
// whether  a coupon has been used by a user for a specific product and when it was used
// This helps prevent multiple uses of the same coupon by the same user for the same product
import { DataTypes, Model } from "sequelize";

const CouponUsage = (sequelize) => {
  class CouponUsage extends Model {
    static associate(models) {
      CouponUsage.belongsTo(models.User, { foreignKey: "userId", as: "user" });
      CouponUsage.belongsTo(models.Coupon, { foreignKey: "couponId", as: "coupon" });
      CouponUsage.belongsTo(models.Product, { foreignKey: "productId", as: "product" });
    }
  }

  CouponUsage.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      couponId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      productId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      usedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: "CouponUsage",
      tableName: "coupon_usages",
      timestamps: false,
      indexes: [
        {
          unique: true,
          fields: ["userId", "couponId", "productId"], // ✅ unique per user+coupon+product
        },
      ],
    }
  );

  return CouponUsage;
};

export default CouponUsage;
