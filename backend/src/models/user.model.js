const { DataTypes, Model } = require('sequelize');
const bcrypt = require('bcryptjs');

// User Model
const User = (sequelize) => {
  class User extends Model {
    static associate(models) {
      User.hasMany(models.Order, { foreignKey: 'userId', as: 'orders' });
      User.hasMany(models.Cart, { foreignKey: 'userId', as: 'cartItems' });
      User.hasMany(models.Review, { foreignKey: 'userId', as: 'reviews' });
      User.hasMany(models.Wishlist, { foreignKey: 'userId', as: 'wishlistItems' });
    }

    // Instance method to check password
    async checkPassword(password) {
      return await bcrypt.compare(password, this.password);
    }

    // Instance method to hash password
    async hashPassword() {
      if (this.changed('password')) {
        this.password = await bcrypt.hash(this.password, 12);
      }
    }
  }

  User.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    firstName: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'First name is required' },
        len: { args: [2, 50], msg: 'First name must be between 2-50 characters' }
      }
    },
    lastName: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Last name is required' },
        len: { args: [2, 50], msg: 'Last name must be between 2-50 characters' }
      }
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: { msg: 'Email already exists' },
      validate: {
        isEmail: { msg: 'Invalid email format' },
        notEmpty: { msg: 'Email is required' }
      }
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Password is required' },
        len: { args: [6, 255], msg: 'Password must be at least 6 characters' }
      }
    },
    phone: {
      type: DataTypes.STRING(20),
      validate: {
        is: { args: /^[\+]?[1-9][\d]{0,15}$/, msg: 'Invalid phone number format' }
      }
    },
    dateOfBirth: {
      type: DataTypes.DATEONLY,
      validate: {
        isDate: { msg: 'Invalid date format' },
        isBefore: { args: new Date().toISOString(), msg: 'Date of birth cannot be in the future' }
      }
    },
    gender: {
      type: DataTypes.ENUM('male', 'female', 'other', 'prefer_not_to_say'),
      defaultValue: 'prefer_not_to_say'
    },
    role: {
      type: DataTypes.ENUM('customer', 'admin', 'super_admin'),
      defaultValue: 'customer',
      allowNull: false
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    emailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    avatar: {
      type: DataTypes.TEXT,
      validate: {
        isUrl: { msg: 'Avatar must be a valid URL' }
      }
    },
    lastLoginAt: DataTypes.DATE,
    passwordResetToken: DataTypes.STRING,
    passwordResetExpires: DataTypes.DATE,
    emailVerificationToken: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    paranoid: true, // Soft delete
    hooks: {
      beforeSave: async (user) => {
        await user.hashPassword();
      }
    },
    indexes: [
      { fields: ['email'] },
      { fields: ['role'] },
      { fields: ['isActive'] }
    ]
  });

  return User;
};


  module.exports = User;