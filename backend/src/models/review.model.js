// Review Model
const { DataTypes, Model } = require('sequelize');
const Review = (sequelize) => {
  class Review extends Model {
    static associate(models) {
      Review.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
      Review.belongsTo(models.Product, { foreignKey: 'productId', as: 'product' });
      Review.belongsTo(models.Order, { foreignKey: 'orderId', as: 'order' });
    }
  }

  Review.init({
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
    productId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'products', key: 'id' }
    },
    orderId: {
      type: DataTypes.UUID,
      references: { model: 'orders', key: 'id' }
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: { args: 1, msg: 'Rating must be at least 1' },
        max: { args: 5, msg: 'Rating cannot exceed 5' }
      }
    },
    title: {
      type: DataTypes.STRING(200),
      validate: {
        len: { args: [0, 200], msg: 'Review title cannot exceed 200 characters' }
      }
    },
    comment: {
      type: DataTypes.TEXT,
      validate: {
        len: { args: [0, 2000], msg: 'Review comment cannot exceed 2000 characters' }
      }
    },
    isVerifiedPurchase: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isApproved: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    helpfulCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: { args: 0, msg: 'Helpful count cannot be negative' }
      }
    }
  }, {
    sequelize,
    modelName: 'Review',
    tableName: 'reviews',
    timestamps: true,
    indexes: [
      { fields: ['userId'] },
      { fields: ['productId'] },
      { fields: ['orderId'] },
      { fields: ['rating'] },
      { fields: ['isApproved'] },
      { fields: ['isVerifiedPurchase'] },
      { unique: true, fields: ['userId', 'productId', 'orderId'] }
    ]
  });

  return Review;
};

module.exports = Review;