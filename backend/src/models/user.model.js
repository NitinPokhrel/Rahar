import { DataTypes, Model } from "sequelize";
import bcrypt from "bcryptjs";

const User = (sequelize) => {
  class User extends Model {
    static associate(models) {
      User.hasMany(models.Order, { foreignKey: "userId", as: "orders" });
      User.hasMany(models.Cart, { foreignKey: "userId", as: "cartItems" });
      User.hasMany(models.Review, { foreignKey: "userId", as: "reviews" });
      User.hasMany(models.Wishlist, {
        foreignKey: "userId",
        as: "wishlistItems",
      });
    }

    // Instance method to check password
    async checkPassword(password) {
      return await bcrypt.compare(password, this.password);
    }

    // Instance method to hash password
    async hashPassword() {
      if (this.changed("password")) {
        this.password = await bcrypt.hash(this.password, 12);
      }
    }
  }

  User.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      firstName: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
          notEmpty: { msg: "First name is required" },
          len: {
            args: [2, 50],
            msg: "First name must be between 2-50 characters",
          },
        },
      },
      lastName: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
          notEmpty: { msg: "Last name is required" },
          len: {
            args: [2, 50],
            msg: "Last name must be between 2-50 characters",
          },
        },
      },
      email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: { msg: "Email already exists" },
        validate: {
          isEmail: { msg: "Invalid email format" },
          notEmpty: { msg: "Email is required" },
        },
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: { msg: "Password is required" },
          len: {
            args: [8, 255],
            msg: "Password must be at least 8 characters",
          },
        },
      },
      phone: {
        type: DataTypes.STRING(20),
        validate: {
          is: {
            args: /^[\+]?[1-9][\d]{0,15}$/,
            msg: "Invalid phone number format",
          },
        },
      },
      dateOfBirth: {
        type: DataTypes.DATEONLY,
        validate: {
          isDate: { msg: "Invalid date format" },
          isBefore: {
            args: new Date().toISOString(),
            msg: "Date of birth cannot be in the future",
          },
        },
      },
      gender: {
        type: DataTypes.ENUM("male", "female", "other"),
        defaultValue: "other",
      },
      role: {
        type: DataTypes.ENUM("customer", "admin"),
        defaultValue: "customer",
        allowNull: false,
      },
      permissions: {
        type: DataTypes.ARRAY(
          DataTypes.ENUM(
            "createUser",
            "removeUser",
            "addProduct",
            "removeProduct",
            "updateProduct",
            "updateOrder"
          )
        ),
        allowNull: false,
        defaultValue: [],
      },

      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      emailVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },

      address: {
        type: DataTypes.JSON,
        allowNull: false,
        validate: {
          isValidAddress(value) {
            if (
              !value ||
              typeof value !== "object" ||
              !value.province ||
              !value.city ||
              !value.fullAddress
            ) {
              throw new Error(
                "Address must include province, city, and fullAddress"
              );
            }

            if (
              typeof value.province !== "string" ||
              value.province.trim().length < 2
            ) {
              throw new Error(
                "Province must be a valid string with at least 2 characters"
              );
            }

            if (
              typeof value.city !== "string" ||
              value.city.trim().length < 2
            ) {
              throw new Error(
                "City must be a valid string with at least 2 characters"
              );
            }

            if (
              typeof value.fullAddress !== "string" ||
              value.fullAddress.trim().length < 5 ||
              value.fullAddress.trim().length > 255
            ) {
              throw new Error(
                "Full address must be between 5 and 255 characters"
              );
            }

            const validChars = /^[a-zA-Z0-9\s,.\-()#:/]+$/;
            if (!validChars.test(value.fullAddress)) {
              throw new Error("Full address contains invalid characters");
            }
          },
        },
      },

      // Profile Picture url

      avatar: {
        type: DataTypes.JSON,
        allowNull: true,
        validate: {
          isValidAvatar(value) {
            if (!value) return; // allow null

            const { url, height, width, blurhash } = value;

            if (typeof url !== "string" || !/^https?:\/\/.+/.test(url)) {
              throw new Error("Avatar URL must be a valid URL");
            }

            if (typeof height !== "number" || typeof width !== "number") {
              throw new Error("Avatar height and width must be numbers");
            }

            if (typeof blurhash !== "string") {
              throw new Error("Avatar blurhash must be a string");
            }
          },
        },
      },

      // This is commented out as we are using clerk to handle authentication and all that

      // lastLoginAt: DataTypes.DATE,
      // passwordResetToken: DataTypes.STRING,
      // passwordResetExpires: DataTypes.DATE,
      // emailVerificationToken: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "User",
      tableName: "users",
      timestamps: true,
      paranoid: true, // Soft delete
      hooks: {
        beforeSave: async (user) => {
          await user.hashPassword();
        },
      },
      indexes: [
        { fields: ["email"] },
        { fields: ["role"] },
        { fields: ["isActive"] },
      ],
    }
  );

  return User;
};

export default User;
