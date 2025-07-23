import { DataTypes, Model } from "sequelize";

const User = (sequelize) => {
  class User extends Model {
    static associate(models) {
      // Relationship with Auth model
      User.belongsTo(models.Auth, { 
        foreignKey: "authId", 
        as: "auth",
        onDelete: "CASCADE"
      });

      // Existing relationships
      User.hasMany(models.Order, { foreignKey: "userId", as: "orders" });
      User.hasMany(models.Cart, { foreignKey: "userId", as: "cartItems" });
      User.hasMany(models.Review, { foreignKey: "userId", as: "reviews" });
      User.hasMany(models.Wishlist, {
        foreignKey: "userId",
        as: "wishlistItems",
      });
    }

    trimFields() {
      const fieldsToTrim = ["firstName", "lastName", "phone"];
      fieldsToTrim.forEach((field) => {
        if (this[field] && typeof this[field] === "string") {
          this[field] = this[field].trim();
        }
      });

      // Trim address fields
      if (this.address) {
        ["province", "city", "fullAddress"].forEach((field) => {
          if (this.address[field] && typeof this.address[field] === "string") {
            this.address[field] = this.address[field].trim();
          }
        });
      }
    }

    getFullName() {
      return `${this.firstName} ${this.lastName}`.trim();
    }

    updateProfile(profileData) {
      const allowedFields = [
        'firstName', 'lastName', 'phone', 'dateOfBirth', 
        'gender', 'address', 'avatar', 'preferences'
      ];
      
      Object.keys(profileData).forEach(key => {
        if (allowedFields.includes(key)) {
          this[key] = profileData[key];
        }
      });
    }
  }

  User.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      authId: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
        references: {
          model: 'auth',
          key: 'id'
        },
        validate: {
          notEmpty: { msg: "Auth ID is required" },
        },
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
            "manageUsers",
            "manageCoupons",
            "manageProducts",
            "manageOrders",
            "manageStore"
          )
        ),
        allowNull: false,
        defaultValue: [],
      },
      address: {
        type: DataTypes.JSON,
        allowNull: true, // Made optional since users might not provide address immediately
        validate: {
          isValidAddress(value) {
            if (!value) return; // Allow null/undefined

            if (
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
      avatar: {
        type: DataTypes.JSON,
        allowNull: true,
        validate: {
          isValidAvatar(value) {
            if (!value) return;

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
      preferences: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {
          notifications: {
            email: true,
            push: true,
            orderUpdates: true,
            promotions: false,
          },
          privacy: {
            profileVisible: false,
            showOnlineStatus: false,
          },
          display: {
            theme: "light",
            language: "en",
          },
        },
      },
      isProfileComplete: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      profileCompletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "User",
      tableName: "users",
      timestamps: true,
      paranoid: true,
      hooks: {
        beforeValidate: (user) => {
          user.trimFields();
        },
        beforeSave: (user) => {
          // Check if profile is complete
          const requiredFields = ['firstName', 'lastName', 'phone', 'address'];
          const isComplete = requiredFields.every(field => {
            if (field === 'address') {
              return user.address && user.address.province && user.address.city && user.address.fullAddress;
            }
            return user[field] && user[field].toString().trim().length > 0;
          });

          if (isComplete && !user.isProfileComplete) {
            user.isProfileComplete = true;
            user.profileCompletedAt = new Date();
          } else if (!isComplete && user.isProfileComplete) {
            user.isProfileComplete = false;
            user.profileCompletedAt = null;
          }
        },
      },
      indexes: [
        { fields: ["authId"] },
        { fields: ["role"] },
        { fields: ["isProfileComplete"] },
        { fields: ["createdAt"] },
      ],
      scopes: {
        complete: {
          where: {
            isProfileComplete: true,
          },
        },
        admins: {
          where: {
            role: "admin",
          },
        },
        customers: {
          where: {
            role: "customer",
          },
        },
      },
    }
  );

  return User;
};

export default User;