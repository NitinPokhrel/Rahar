// Order Item Model
import { DataTypes, Model } from "sequelize";
const OrderItem = (sequelize) => {
  class OrderItem extends Model {
    static associate(models) {
      OrderItem.belongsTo(models.Order, { foreignKey: "orderId", as: "order" });
      OrderItem.belongsTo(models.Product, {
        foreignKey: "productId",
        as: "product",
      });
      OrderItem.belongsTo(models.ProductVariant, {
        foreignKey: "variantId",
        as: "variant",
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
        references: { model: "orders", key: "id" },
      },
      productId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: "products", key: "id" },
      },
      variantId: {
        type: DataTypes.UUID,
        references: { model: "product_variants", key: "id" },
      },

      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: { args: 1, msg: "Quantity must be at least 1" },
        },
      },
      unitPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          min: { args: 0, msg: "Unit price cannot be negative" },
        },
      },
    },
    {
      sequelize,
      modelName: "OrderItem",
      tableName: "order_items",
      timestamps: true,
      indexes: [
        { fields: ["orderId"] },
        { fields: ["productId"] },
        { fields: ["variantId"] },
      ],
    }
  );

  return OrderItem;
};

export default OrderItem;
