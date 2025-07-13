// Coupon Model
import { DataTypes, Model } from "sequelize";
const Coupon = (sequelize) => {
  class Coupon extends Model {
    static associate(models) {
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
  if (!orderTotal || isNaN(orderTotal)) return 0;

  if (this.type === "percentage") {
    let discount = (orderTotal * this.value) / 100;
    if (this.maxDiscountAmount && discount > this.maxDiscountAmount) {
      discount = this.maxDiscountAmount;
    }
    return Number(discount);
  } else {
    return Math.min(this.value, orderTotal);
  }
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
          notNull: { msg: "Coupon value is required" },
          min: { args: [0], msg: "Coupon value cannot be negative" },
          customValidation(value) {
            if (this.type === "percentage" && value > 100) {
              throw new Error("Percentage discount cannot exceed 100%");
            }
          },
        },
      },

      maxDiscountAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          notNull: { msg: "Max discount amount is required" },
          min: { args: [0], msg: "Max discount amount cannot be negative" },
        },
      },

      minimumAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          notNull: { msg: "Minimum amount is required" },
          min: { args: [0], msg: "Minimum amount cannot be negative" },
        },
      },

      usageLimit: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notNull: { msg: "Usage limit is required" },
          min: { args: [1], msg: "Usage limit must be at least 1" },
        },
      },

      usageLimitPerUser: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        validate: {
          min: { args: [1], msg: "Usage limit per user must be at least 1" },
        },
      },

      usedCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        validate: {
          min: { args: [0], msg: "Used count cannot be negative" },
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
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      isGlobal: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: "If true, this coupon can be used for all products",
      },
      applicableProducts: {
        type: DataTypes.ARRAY(DataTypes.UUID),
        defaultValue: [],
      },
    },
    {
      sequelize,
      modelName: "Coupon",
      tableName: "coupons",
      timestamps: true,
      paranoid: true,
      indexes: [
        { fields: ["code"] },
        { fields: ["type"] },
        { fields: ["isActive"] },
        { fields: ["startDate"] },
        { fields: ["endDate"] },
        { fields: ["applicableProducts"], using: "gin" },
      ],
    }
  );

  // Hook to parse strings into numbers
  Coupon.beforeValidate((coupon) => {
    const numberFields = [
      "value",
      "maxDiscountAmount",
      "minimumAmount",
      "usageLimit",
      "usageLimitPerUser",
      "usedCount",
    ];

    for (const field of numberFields) {
      if (
        coupon[field] !== undefined &&
        coupon[field] !== null &&
        typeof coupon[field] === "string"
      ) {
        const parsed =
          field.includes("Limit") || field === "usedCount"
            ? parseInt(coupon[field], 10)
            : parseFloat(coupon[field]);
        coupon.setDataValue(field, isNaN(parsed) ? null : parsed);
      }
    }
  });

  return Coupon;
};

export default Coupon;
