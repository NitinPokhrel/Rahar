// Newsletter Subscription Model
import { DataTypes, Model } from ('sequelize');
const NewsletterSubscription = (sequelize) => {
  class NewsletterSubscription extends Model {}

  NewsletterSubscription.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: { msg: 'Email already subscribed' },
      validate: {
        isEmail: { msg: 'Invalid email format' },
        notEmpty: { msg: 'Email is required' }
      }
    },
    firstName: DataTypes.STRING(50),
    lastName: DataTypes.STRING(50),
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    subscribedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    unsubscribedAt: DataTypes.DATE,
    source: {
      type: DataTypes.STRING(50),
      defaultValue: 'website'
    }
  }, {
    sequelize,
    modelName: 'NewsletterSubscription',
    tableName: 'newsletter_subscriptions',
    timestamps: true,
    indexes: [
      { fields: ['email'] },
      { fields: ['isActive'] },
      { fields: ['source'] }
    ]
  });

  return NewsletterSubscription;
};

export default NewsletterSubscription;
