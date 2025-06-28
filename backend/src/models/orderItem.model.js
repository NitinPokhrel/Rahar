// Order Item Model
import { DataTypes, Model } from "sequelize";
const OrderItem = (sequelize) => {
  class OrderItem extends Model {
    static associate(models) {
      OrderItem.belongsTo(models.Order, {
        foreignKey: "orderId",
        as: "order",
      });

      OrderItem.belongsTo(models.Product, {
        foreignKey: "productId",
        as: "product",
      });
    }
  }

  OrderItem.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },

      orderId: {
        type: DataTypes.UUID,
        allowNull: false,
      },

      productId: {
        type: DataTypes.UUID,
        allowNull: false,
      },

      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: {
          min: 1,
        },
      },

      price: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },

      discount: {
        type: DataTypes.FLOAT,
        defaultValue: 0,
      },
    },
    {
      sequelize,
      modelName: "OrderItem",
      tableName: "order_items",
      timestamps: true,
    }
  );

  return OrderItem;
};

export default OrderItem;
