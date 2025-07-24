// Coupon Usage Model
import { DataTypes, Model } from "sequelize";
const CouponUsage = (sequelize) => {
  
  class CouponUsage extends Model {
    static associate(models) {
      CouponUsage.belongsTo(models.User, { foreignKey: "userId", as: "user" });
      CouponUsage.belongsTo(models.Coupon, {
        foreignKey: "couponId",
        as: "coupon",
      });
      CouponUsage.belongsTo(models.Product, {
        foreignKey: "productId",
        as: "product",
      });
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
