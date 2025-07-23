import { DataTypes, Model } from "sequelize";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const Auth = (sequelize) => {
  class Auth extends Model {
    static associate(models) {
      // One-to-one relationship with User model
      Auth.hasOne(models.User, {
        foreignKey: "authId",
        as: "profile",
        onDelete: "CASCADE",
      });
    }

    async checkPassword(password) {
      if (!this.password) {
        throw new Error("No password set for this account");
      }
      return await bcrypt.compare(password, this.password);
    }

    async hashPassword() {
      if (this.changed("password") && this.password) {
        this.password = await bcrypt.hash(this.password, 12);
      }
    }

    generateVerificationToken() {
      this.emailVerificationToken = crypto.randomBytes(32).toString("hex");
      this.emailVerificationExpires = new Date(
        Date.now() + 24 * 60 * 60 * 1000
      ); // 24 hours
    }

    generatePasswordResetToken() {
      this.passwordResetToken = crypto.randomBytes(32).toString("hex");
      this.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      return this.passwordResetToken;
    }

    clearPasswordResetToken() {
      this.passwordResetToken = null;
      this.passwordResetExpires = null;
    }

    clearEmailVerificationToken() {
      this.emailVerificationToken = null;
      this.emailVerificationExpires = null;
    }

    isEmailVerificationTokenValid() {
      return (
        this.emailVerificationExpires &&
        new Date() < this.emailVerificationExpires
      );
    }

    isPasswordResetTokenValid() {
      return (
        this.passwordResetExpires && new Date() < this.passwordResetExpires
      );
    }

    markEmailAsVerified() {
      this.emailVerified = true;
      this.emailVerifiedAt = new Date();
      this.clearEmailVerificationToken();
    }

    updateLastLogin() {
      this.lastLoginAt = new Date();
    }
  }

  Auth.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: { msg: "Email already exists" },
        set(value) {
          if (typeof value === "string") {
            this.setDataValue("email", value.trim().toLowerCase());
          }
        },
        validate: {
          isEmail: { msg: "Invalid email format" },
          notEmpty: { msg: "Email is required" },
        },
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: true, // Allow null for Google OAuth users
        validate: {
          customPasswordValidation(value) {
            // Only validate password if it's being set and no Google ID exists
            if (!this.googleId && (!value || value.trim() === "")) {
              throw new Error("Password is required for email registration");
            }
            if (value && value.length < 8) {
              throw new Error("Password must be at least 8 characters");
            }
          },
        },
      },
      googleId: {
        type: DataTypes.STRING(100),
        allowNull: true,
        unique: true,
        validate: {
          notEmpty: { msg: "Google ID cannot be empty" },
        },
      },
      provider: {
        type: DataTypes.ENUM("email", "google"),
        allowNull: false,
        defaultValue: "email",
      },
      emailVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      emailVerifiedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      emailVerificationToken: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      emailVerificationExpires: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      passwordResetToken: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      passwordResetExpires: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      isSuspended: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      suspendedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      suspensionReason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      lastLoginAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      loginAttempts: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      lockedUntil: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      twoFactorEnabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      twoFactorSecret: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      backupCodes: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: true,
        defaultValue: [],
      },
    },
    {
      sequelize,
      modelName: "Auth",
      tableName: "auth",
      timestamps: true,
      paranoid: true, // Soft delete
      hooks: {
        beforeSave: async (auth) => {
          await auth.hashPassword();

          // Auto-verify email for Google OAuth users
          if (
            auth.googleId &&
            auth.provider === "google" &&
            !auth.emailVerified
          ) {
            auth.markEmailAsVerified();
          }
        },
        beforeCreate: (auth) => {
          // Generate email verification token for email signups
          if (auth.provider === "email" && !auth.emailVerified) {
            auth.generateVerificationToken();
          }
        },
      },
      indexes: [
        { fields: ["email"] },
        { fields: ["googleId"] },
        { fields: ["provider"] },
        { fields: ["isActive"] },
        { fields: ["emailVerificationToken"] },
        { fields: ["passwordResetToken"] },
        { fields: ["lastLoginAt"] },
      ],
      scopes: {
        active: {
          where: {
            isActive: true,
            isSuspended: false,
          },
        },
        verified: {
          where: {
            emailVerified: true,
          },
        },
      },
    }
  );

  return Auth;
};

export default Auth;
