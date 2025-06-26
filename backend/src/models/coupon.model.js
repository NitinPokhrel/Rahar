// models/Coupon.js
import { DataTypes, Model } from "sequelize";

const Coupon = (sequelize) => {
   class Coupon extends Model {
    static associate(models) {
      Coupon.hasMany(models.CouponUsage, {
        foreignKey: "couponId",
        as: "usages", // alias to access coupon usages
        onDelete: "CASCADE",
      });
    }
  }

  Coupon.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      code: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
     
      discountType: {
        type: DataTypes.ENUM("percentage", "fixed"),
        allowNull: false,
      },
      discountAmount: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      minOrderAmount: { //minimum number of order amount to apply the coupon
        type: DataTypes.FLOAT,
        defaultValue: 0,
      },
      maxDiscount: {
        type: DataTypes.FLOAT, //  maximum discount amount that can be applied
      },
      usageLimit: {
        type: DataTypes.INTEGER, // total times the coupon can be used
      },
      usedCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      sequelize,
      modelName: "Coupon",
      tableName: "coupons",
      timestamps: true,
    }
  );

  return Coupon;
};

export default Coupon;
