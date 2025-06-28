import SequelizePkg from 'sequelize';
import sequelize from '../db/db.js';
import UserDef from './user.model.js';
import CartDef from './cart.model.js';
import CategoryDef from './category.model.js';
import CouponDef from './coupon.model.js';
import CouponUsageDef from './couponUsage.model.js';
import NewsletterSubscriptionDef from './newsLetterSubscription.model.js';
import OrderDef from './order.model.js';
import OrderItemDef from './orderItem.model.js';
import ProductDef from './product.model.js';
import ProductVariantDef from './productVariant.model.js';
import ReviewDef from './review.model.js';
import SettingDef from './setting.model.js';
import WishlistDef from './wishlist.model.js';

const { Sequelize } = SequelizePkg;

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
  ProductVariant: ProductVariantDef(sequelize),
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

// Extract individual models for named exports
const {
  User,
  Cart,
  Category,
  Coupon,
  CouponUsage,
  NewsletterSubscription,
  Order,
  OrderItem,
  Product,
  ProductVariant,
  Review,
  Setting,
  Wishlist,
} = models;

// Export individual models as named exports
export {
  sequelize,
  Sequelize,
  models,
  // Individual model exports
  User,
  Cart,
  Category,
  Coupon,
  CouponUsage,
  NewsletterSubscription,
  Order,
  OrderItem,
  Product,
  ProductVariant,
  Review,
  Setting,
  Wishlist,
};

// Default export
export default {
  sequelize,
  Sequelize,
  ...models,
};