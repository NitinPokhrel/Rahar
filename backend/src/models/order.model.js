// models/Order.js
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

      userId: {
        type: DataTypes.UUID,
        allowNull: false,
      },

      status: {
        type: DataTypes.ENUM(
          "pending",        // just placed
          "confirmed",      // confirmed by system or admin
          "shipped",        // out for delivery
          "delivered",      // delivered successfully
          "cancelled",      // user cancelled
          "returned"        // product returned
        ),
        defaultValue: "pending",
      },

      totalAmount: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },

      discountAmount: {
        type: DataTypes.FLOAT,
        defaultValue: 0,
      },

      paymentMethod: {
        type: DataTypes.ENUM("cod", "esewa", "khalti", "card"),
        allowNull: false,
      },

      paymentStatus: {
        type: DataTypes.ENUM("pending", "paid", "failed"),
        defaultValue: "pending",
      },

      shippingAddress: {
        type: DataTypes.JSONB, // or store `addressId` if you use separate Address table
        allowNull: false,
      },

      couponId: {
        type: DataTypes.UUID, // FK to Coupon table
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Order",
      tableName: "orders",
      timestamps: true,
    }
  );

  return Order;
};

export default Order;
