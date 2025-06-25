import { DataTypes, Model } from "sequelize";

const Wishlist = (sequelize) => {
  class Wishlist extends Model {
    static associate(models) {
      Wishlist.belongsTo(models.User, { foreignKey: "userId", as: "user" });
      Wishlist.belongsTo(models.Product, {
        foreignKey: "productId",
        as: "product",
      });
    }
  }

  Wishlist.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: "users", key: "id" },
      },
      productId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: "products", key: "id" },
      },
    },
    {
      sequelize,
      modelName: "Wishlist",
      tableName: "wishlists",
      timestamps: true,
      indexes: [
        { fields: ["userId"] },
        { fields: ["productId"] },
        { unique: true, fields: ["userId", "productId"] },
      ],
    }
  );

  return Wishlist;
};

export default Wishlist;
