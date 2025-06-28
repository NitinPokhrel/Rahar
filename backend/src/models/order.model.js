import { DataTypes, Model } from "sequelize";

const Order = (sequelize) => {
  class Order extends Model {
    static associate(models) {
      Order.belongsTo(models.User, { foreignKey: "userId", as: "user" });

      Order.belongsTo(models.Coupon, { foreignKey: "couponId", as: "coupon" });
      Order.hasMany(models.OrderItem, { foreignKey: "orderId", as: "items" });
    }
  }

  Order.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      orderNumber: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: { msg: "Order number must be unique" },
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: "users", key: "id" },
      },
      status: {
        type: DataTypes.ENUM(
          "pending",
          "confirmed",
          "processing",
          "shipped",
          "delivered",
          "cancelled",
          "refunded"
        ),
        defaultValue: "pending",
        allowNull: false,
      },
      paymentStatus: {
        type: DataTypes.ENUM("pending", "paid", "failed", "refunded"),
        defaultValue: "pending",
        allowNull: false,
      },
      paymentMethod: {
        type: DataTypes.ENUM("stripe", "qr_bank", "cash_on_delivery"),
        allowNull: false,
      },
      paymentIntentId: {
        type: DataTypes.STRING(100),
      },
      subtotal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          min: { args: 0, msg: "Subtotal cannot be negative" },
        },
      },
      shippingAmount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
        validate: {
          min: { args: 0, msg: "Shipping amount cannot be negative" },
        },
      },
      discountAmount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
        validate: {
          min: { args: 0, msg: "Discount amount cannot be negative" },
        },
      },

      couponId: {
        type: DataTypes.UUID,
        references: { model: "coupons", key: "id" },
      },
      shippingAddressId: {
        type: DataTypes.UUID,
        allowNull: false,
        // references: { model: "addresses", key: "id" },
      },
      notes: DataTypes.TEXT,

      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      shippedAt: DataTypes.DATE,
      deliveredAt: DataTypes.DATE,
      cancelledAt: DataTypes.DATE,

      cancellationReason: DataTypes.TEXT,
    },
    {
      sequelize,
      modelName: "Order",
      tableName: "orders",
      timestamps: true,
      indexes: [
        { fields: ["orderNumber"] },
        { fields: ["userId"] },
        { fields: ["status"] },
        { fields: ["paymentStatus"] },
        { fields: ["couponId"] },
        { fields: ["createdAt"] },
      ],
      hooks: {
        beforeCreate: (order) => {
          // Generate a unique order number like: ORD-20250627-ABC123
          const randomSuffix = Math.random()
            .toString(36)
            .substring(2, 8)
            .toUpperCase();
          const datePart = new Date()
            .toISOString()
            .slice(0, 10)
            .replace(/-/g, "");
          order.orderNumber = `ORD-${datePart}-${randomSuffix}`;
        },
      },
    }
  );

  return Order;
};

export default Order;
