import { DataTypes } from 'sequelize';
import sequelize from '../db/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID, 
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  displayName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  passwordHash: {
    type: DataTypes.STRING,
    allowNull: false
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  address: {
    type: DataTypes.STRING,
    allowNull: true
  },
  city: {
    type: DataTypes.STRING,
    allowNull: true
  },
  state: {
    type: DataTypes.STRING,
    allowNull: true
  },
  zipCode: {
    type: DataTypes.STRING,
    allowNull: true
  },
  country: {
    type: DataTypes.STRING,
    allowNull: true
  },
  role: {
    type: DataTypes.ENUM('customer', 'vendor', 'admin'),
    defaultValue: 'customer',
    allowNull: false
  },
  image: {
    type: DataTypes.STRING,
    allowNull: true
  },
  refreshToken: {
    type: DataTypes.STRING,
    allowNull: true
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'users',
  timestamps: true
});

// Sequelize Hook to hash password before saving
User.beforeSave(async (user) => {
  if (user.changed('passwordHash')) {
    user.passwordHash = await bcrypt.hash(user.passwordHash, 10);
  }
});


// Instance method to verify password
User.prototype.isPasswordCorrect = async function(password) {
  return await bcrypt.compare(password, this.passwordHash);
};

// Instance method to generate access token
User.prototype.generateAccessToken = function() {
  return jwt.sign(
    { id: this.id, email: this.email, role: this.role },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );
};

// Instance method to generate refresh token
User.prototype.generateRefreshToken = function() {
  return jwt.sign(
    { id: this.id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
  );
};

export default User;