<<<<<<< HEAD
// models/Coupon.js
import { DataTypes, Model } from "sequelize";

=======
// Coupon Model
const { DataTypes, Model } = require("sequelize");
>>>>>>> d9777c165a65d6c2978e53f2855a2b14d5776c84
const Coupon = (sequelize) => {
   class Coupon extends Model {
    static associate(models) {
<<<<<<< HEAD
      Coupon.hasMany(models.CouponUsage, {
        foreignKey: "couponId",
        as: "usages", // alias to access coupon usages
        onDelete: "CASCADE",
      });
=======
      Coupon.hasMany(models.Order, { foreignKey: "couponId", as: "orders" });
      Coupon.hasMany(models.CouponUsage, {
        foreignKey: "couponId",
        as: "usages",
      });
    }

    // Instance method to check if coupon is valid
    isValid(userId = null, orderTotal = 0) {
      const now = new Date();

      // Check if coupon is active
      if (!this.isActive) return { valid: false, reason: "Coupon is inactive" };

      // Check date validity
      if (this.startDate && now < this.startDate)
        return { valid: false, reason: "Coupon not yet active" };
      if (this.endDate && now > this.endDate)
        return { valid: false, reason: "Coupon has expired" };

      // Check usage limits
      if (this.usageLimit && this.usedCount >= this.usageLimit)
        return { valid: false, reason: "Coupon usage limit reached" };

      // Check minimum order amount
      if (this.minimumAmount && orderTotal < this.minimumAmount) {
        return {
          valid: false,
          reason: `Minimum order amount of ${this.minimumAmount} required`,
        };
      }

      return { valid: true };
    }

    // Calculate discount amount
    calculateDiscount(orderTotal) {
      if (this.type === "percentage") {
        let discount = (orderTotal * this.value) / 100;
        if (this.maxDiscountAmount && discount > this.maxDiscountAmount) {
          discount = this.maxDiscountAmount;
        }
        return discount;
      } else {
        return Math.min(this.value, orderTotal);
      }
>>>>>>> d9777c165a65d6c2978e53f2855a2b14d5776c84
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
<<<<<<< HEAD
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
=======
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: { msg: "Coupon code must be unique" },
        validate: {
          notEmpty: { msg: "Coupon code is required" },
          len: {
            args: [3, 50],
            msg: "Coupon code must be between 3-50 characters",
          },
          isUppercase: { msg: "Coupon code must be uppercase" },
        },
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
          notEmpty: { msg: "Coupon name is required" },
        },
      },
      description: DataTypes.TEXT,
      type: {
        type: DataTypes.ENUM("percentage", "fixed"),
        allowNull: false,
        validate: {
          notEmpty: { msg: "Coupon type is required" },
        },
      },
      value: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          min: { args: 0, msg: "Coupon value cannot be negative" },
          customValidation(value) {
            if (this.type === "percentage" && value > 100) {
              throw new Error("Percentage discount cannot exceed 100%");
            }
          },
        },
      },
      maxDiscountAmount: {
        type: DataTypes.DECIMAL(10, 2),
        validate: {
          min: { args: 0, msg: "Max discount amount cannot be negative" },
        },
      },
      minimumAmount: {
        type: DataTypes.DECIMAL(10, 2),
        validate: {
          min: { args: 0, msg: "Minimum amount cannot be negative" },
        },
      },
      usageLimit: {
        type: DataTypes.INTEGER,
        validate: {
          min: { args: 1, msg: "Usage limit must be at least 1" },
        },
      },
      usageLimitPerUser: {
        type: DataTypes.INTEGER,
        validate: {
          min: { args: 1, msg: "Usage limit per user must be at least 1" },
        },
>>>>>>> d9777c165a65d6c2978e53f2855a2b14d5776c84
      },
      usedCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
<<<<<<< HEAD
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: true,
=======
        validate: {
          min: { args: 0, msg: "Used count cannot be negative" },
        },
      },
      startDate: DataTypes.DATE,
      endDate: {
        type: DataTypes.DATE,
        validate: {
          isAfterStartDate(value) {
            if (this.startDate && value && value <= this.startDate) {
              throw new Error("End date must be after start date");
            }
          },
        },
>>>>>>> d9777c165a65d6c2978e53f2855a2b14d5776c84
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
<<<<<<< HEAD
=======
      applicableCategories: {
        type: DataTypes.ARRAY(DataTypes.UUID),
        defaultValue: [],
      },
      applicableProducts: {
        type: DataTypes.ARRAY(DataTypes.UUID),
        defaultValue: [],
      },
>>>>>>> d9777c165a65d6c2978e53f2855a2b14d5776c84
    },
    {
      sequelize,
      modelName: "Coupon",
      tableName: "coupons",
      timestamps: true,
<<<<<<< HEAD
=======
      paranoid: true,
      indexes: [
        { fields: ["code"] },
        { fields: ["type"] },
        { fields: ["isActive"] },
        { fields: ["startDate"] },
        { fields: ["endDate"] },
        { fields: ["applicableCategories"], using: "gin" },
        { fields: ["applicableProducts"], using: "gin" },
      ],
>>>>>>> d9777c165a65d6c2978e53f2855a2b14d5776c84
    }
  );

  return Coupon;
};

<<<<<<< HEAD
export default Coupon;
=======
module.exports = Coupon;
>>>>>>> d9777c165a65d6c2978e53f2855a2b14d5776c84
