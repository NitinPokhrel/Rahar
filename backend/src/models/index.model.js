const Sequelize = require('sequelize');
const { sequelize } = require('../db/db');
const UserDef = require('./user.model');
const CartDef = require('./cart.model');
const CategoryDef = require('./category.model');
const CouponDef = require('./coupon.model');
const CouponUsageDef = require('./couponUsage.model');
const NewsletterSubscriptionDef = require('./newsLetterSubscription.model');
const OrderDef = require('./order.model');
const OrderItemDef = require('./orderItem.model');
const ProductDef = require('./product.model');
const ProductVarientDef = require('./productVarient.model');
const ReviewDef = require('./review.model');
const SettingDef = require('./setting.model');
const WishlistDef = require('./wishlist.model');

// Initialize each model with the sequelize instance
const models = {
  User: UserDef(sequelize),
  Cart: CartDef(sequelize),
  Category: CategoryDef(sequelize),
  Coupon: CouponDef(sequelize),
  CouponUsage: CouponUsageDef(sequelize),
  NewsletterSubscription: NewsletterSubscriptionDef(sequelize),
  Order: OrderDef(sequelize),
  OrderItem: OrderItemDef(sequelize),
  Product: ProductDef(sequelize),
  ProductVarient: ProductVarientDef(sequelize),
  Review: ReviewDef(sequelize),
  Setting: SettingDef(sequelize),
  Wishlist: WishlistDef(sequelize),
};

// Run associations (if any)
Object.values(models).forEach((model) => {
  if (typeof model.associate === 'function') {
    model.associate(models);
  }
});

// Export everything
module.exports = {
  sequelize,
  Sequelize,
  ...models,
};
