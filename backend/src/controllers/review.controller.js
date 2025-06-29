// controllers/review.controller.js
import { Review, Product, User, Order, OrderItem } from "../models/index.model.js";
import { sequelize } from "../models/index.model.js";
import { Op } from "sequelize";

export const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10, rating } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = { productId };
    if (rating) whereClause.rating = rating;

    const reviews = await Review.findAndCountAll({
      where: whereClause,
      include: [
        { model: User, as: "user", attributes: ["firstName", "lastName", "avatar"] }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["createdAt", "DESC"]]
    });

    const ratingStats = await Review.findAll({
      where: { productId },
      attributes: [
        "rating",
        [sequelize.fn("COUNT", sequelize.col("rating")), "count"]
      ],
      group: ["rating"],
      raw: true
    });

    return res.status(200).json({
      message: "Reviews fetched successfully",
      status: "success",
      data: {
        reviews: reviews.rows,
        pagination: {
          total: reviews.count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(reviews.count / limit)
        },
        ratingStats
      }
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const submitReview = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, orderId, rating, comment } = req.body;

    if (!productId || !rating) {
      return res.status(400).json({
        message: "Product ID and rating are required",
        status: "error"
      });
    }

    const order = await Order.findOne({
      where: {
        id: orderId,
        userId,
        status: "delivered"
      },
      include: [
        {
          model: OrderItem,
          as: "items",
          where: { productId }
        }
      ]
    });

    if (!order) {
      return res.status(403).json({
        message: "You can only review products you have purchased",
        status: "error"
      });
    }

    let review = await Review.findOne({
      where: { userId, productId, orderId }
    });

    if (review) {
      await review.update({ rating, comment });
    } else {
      review = await Review.create({ userId, productId, orderId, rating, comment });
    }

    return res.status(201).json({
      message: "Review submitted successfully",
      status: "success",
      data: review
    });
  } catch (error) {
    console.error("Error submitting review:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getUserReviews = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const reviews = await Review.findAndCountAll({
      where: { userId },
      include: [
        { model: Product, as: "product", attributes: ["id", "name", "slug", "images"] }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["createdAt", "DESC"]]
    });

    return res.status(200).json({
      message: "Your reviews fetched successfully",
      status: "success",
      data: {
        reviews: reviews.rows,
        pagination: {
          total: reviews.count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(reviews.count / limit)
        }
      }
    });
  } catch (error) {
    console.error("Error fetching user reviews:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
