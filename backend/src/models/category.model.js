// Category Model
import { DataTypes, Model } from "sequelize";
const Category = (sequelize) => {
  class Category extends Model {
    static associate(models) {
      Category.hasMany(models.Product, {
        foreignKey: "categoryId",
        as: "products",
      });
      Category.belongsTo(models.Category, {
        foreignKey: "parentId",
        as: "parent",
      });
      Category.hasMany(models.Category, {
        foreignKey: "parentId",
        as: "children",
      });
    }
  }

  Category.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: { msg: "Category name must be unique" },
        validate: {
          notEmpty: { msg: "Category name is required" },
          len: {
            args: [2, 100],
            msg: "Category name must be between 2-100 characters",
          },
        },
      },
      slug: {
        type: DataTypes.STRING(150),
        allowNull: false,
        unique: { msg: "Category slug must be unique" },
        validate: {
          is: {
            args: /^[a-z0-9-]+$/,
            msg: "Slug must contain only lowercase letters, numbers, and hyphens",
          },
        },
      },
      description: {
        type: DataTypes.TEXT,
        validate: {
          len: {
            args: [0, 1000],
            msg: "Description cannot exceed 1000 characters",
          },
        },
      },

      image: {
        type: DataTypes.TEXT,
        validate: {
          isUrl: { msg: "Image must be a valid URL" },
        },
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      sortOrder: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },

      metaTitle: DataTypes.STRING(200),
      metaDescription: {
        type: DataTypes.TEXT,
        validate: {
          len: {
            args: [0, 500],
            msg: "Meta description cannot exceed 500 characters",
          },
        },
      },
    },
    {
      sequelize,
      modelName: "Category",
      tableName: "categories",
      timestamps: true,
      paranoid: true,
      indexes: [
        { fields: ["slug"] },
        { fields: ["parentId"] },
        // { fields: ["isActive"] },
        // { fields: ["sortOrder"] },
      ],
    }
  );

  return Category;
};

export default Category;
