const { DataTypes, Model } = require('sequelize');

// Address Model
const Address = (sequelize) => {
  class Address extends Model {
    static associate(models) {
      Address.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
      Address.hasMany(models.Order, { foreignKey: 'shippingAddressId', as: 'shippingOrders' });
      Address.hasMany(models.Order, { foreignKey: 'billingAddressId', as: 'billingOrders' });
    }
  }

  Address.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' }
    },
    type: {
      type: DataTypes.ENUM('shipping', 'billing', 'both'),
      defaultValue: 'shipping'
    },
    company: DataTypes.STRING(100),
    addressLine1: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Address line 1 is required' }
      }
    },
    addressLine2: DataTypes.STRING(255),
    city: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'City is required' }
      }
    },
    state: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'State is required' }
      }
    },
    postalCode: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Postal code is required' }
      }
    },
    country: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: 'Nepal',
      validate: {
        notEmpty: { msg: 'Country is required' }
      }
    },
    phone: {
      type: DataTypes.STRING(20),
      validate: {
        is: { args: /^[\+]?[1-9][\d]{0,15}$/, msg: 'Invalid phone number format' }
      }
    },
    isDefault: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    sequelize,
    modelName: 'Address',
    tableName: 'addresses',
    timestamps: true,
    indexes: [
      { fields: ['userId'] },
      { fields: ['type'] },
      { fields: ['isDefault'] }
    ]
  });

  return Address;
};

module.exports = Address;