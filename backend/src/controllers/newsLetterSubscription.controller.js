// controllers/newsletter.controller.js
import { NewsletterSubscription } from "../models/index.model.js";
import { sequelize } from "../models/index.model.js";

export const subscribeNewsletter = async (req, res) => {
  try {
    const { email, firstName, lastName } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
        status: "error"
      });
    }

    const existingSubscription = await NewsletterSubscription.findOne({
      where: { email }
    });

    if (existingSubscription) {
      if (existingSubscription.isActive) {
        return res.status(400).json({
          message: "Email is already subscribed",
          status: "error"
        });
      } else {
        await existingSubscription.update({
          isActive: true,
          firstName,
          lastName,
          subscribedAt: new Date(),
          unsubscribedAt: null
        });

        return res.status(200).json({
          message: "Newsletter subscription reactivated successfully",
          status: "success"
        });
      }
    }

    await NewsletterSubscription.create({
      email,
      firstName,
      lastName,
      source: "website"
    });

    return res.status(201).json({
      message: "Successfully subscribed to newsletter",
      status: "success"
    });
  } catch (error) {
    console.error("Error subscribing to newsletter:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const unsubscribeNewsletter = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
        status: "error"
      });
    }

    const subscription = await NewsletterSubscription.findOne({
      where: { email, isActive: true }
    });

    if (!subscription) {
      return res.status(404).json({
        message: "Subscription not found",
        status: "error"
      });
    }

    await subscription.update({
      isActive: false,
      unsubscribedAt: new Date()
    });

    return res.status(200).json({
      message: "Successfully unsubscribed from newsletter",
      status: "success"
    });
  } catch (error) {
    console.error("Error unsubscribing from newsletter:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
