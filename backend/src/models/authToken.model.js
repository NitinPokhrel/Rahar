import { DataTypes, Model } from "sequelize";
import crypto from "crypto";

const AuthToken = (sequelize) => {
  class AuthToken extends Model {
    static associate(models) {
      // Belongs to Auth model
      AuthToken.belongsTo(models.Auth, {
        foreignKey: "authId",
        as: "auth",
        onDelete: "CASCADE",
      });
    }

    // Check if token is expired
    isExpired() {
      return new Date() > this.expiresAt;
    }

    // Check if refresh token is expired
    isRefreshExpired() {
      return new Date() > this.refreshExpiresAt;
    }

    // Update last used timestamp
    updateLastUsed() {
      this.lastUsedAt = new Date();
    }

    // Generate new token pair
    static generateTokenPair() {
      return {
        accessToken: crypto.randomBytes(32).toString('hex'),
        refreshToken: crypto.randomBytes(32).toString('hex')
      };
    }
  }

  AuthToken.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      authId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'auth',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      accessToken: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },
      refreshToken: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      refreshExpiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      deviceInfo: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {},
        comment: "Stores device information like browser, OS, etc."
      },
      ipAddress: {
        type: DataTypes.STRING(45), // Supports both IPv4 and IPv6
        allowNull: true,
      },
      userAgent: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      location: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {},
        comment: "Stores location information like country, city, etc."
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      lastUsedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      loginAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: "AuthToken",
      tableName: "auth_tokens",
      timestamps: true,
      indexes: [
        { fields: ["authId"] },
        { fields: ["accessToken"] },
        { fields: ["refreshToken"] },
        { fields: ["expiresAt"] },
        { fields: ["refreshExpiresAt"] },
        { fields: ["isActive"] },
        { fields: ["ipAddress"] },
        { fields: ["lastUsedAt"] },
        { fields: ["loginAt"] },
      ],
      scopes: {
        active: {
          where: {
            isActive: true,
          },
        },
        notExpired: {
          where: {
            expiresAt: {
              [sequelize.Sequelize.Op.gt]: new Date()
            }
          }
        },
        refreshNotExpired: {
          where: {
            refreshExpiresAt: {
              [sequelize.Sequelize.Op.gt]: new Date()
            }
          }
        }
      },
    }
  );

  return AuthToken;
};

export default AuthToken;