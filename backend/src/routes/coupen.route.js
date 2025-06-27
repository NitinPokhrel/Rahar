
import { Router } from "express";
import { Coupon, CouponUsage } from "../models/index.model.js";
import { Op } from "sequelize";

const router = Router();

// Validate coupon code
router.post("/validate", async (req, res) => {
  try {
    const userId = req.user.id;
    const { code, orderTotal = 0 } = req.body;

    if (!code) {
      return res.status(400).json({
        message: "Coupon code is required",
        status: "error"
      });
    }

    const coupon = await Coupon.findOne({
      where: { 
        code: code.toUpperCase(),
        isActive: true 
      }
    });

    if (!coupon) {
      return res.status(404).json({
        message: "Invalid coupon code",
        status: "error"
      });
    }

    // Check coupon validity
    const validation = coupon.isValid(userId, orderTotal);
    if (!validation.valid) {
      return res.status(400).json({
        message: validation.reason,
        status: "error"
      });
    }

    // Check per-user usage limit
    if (coupon.usageLimitPerUser) {
      const userUsageCount = await CouponUsage.count({
        where: { couponId: coupon.id, userId }
      });

      if (userUsageCount >= coupon.usageLimitPerUser) {
        return res.status(400).json({
          message: "You have reached the usage limit for this coupon",
          status: "error"
        });
      }
    }

    const discountAmount = coupon.calculateDiscount(orderTotal);

    return res.status(200).json({
      message: "Coupon is valid",
      status: "success",
      data: {
        coupon: {
          id: coupon.id,
          code: coupon.code,
          name: coupon.name,
          type: coupon.type,
          value: coupon.value,
          discountAmount
        }
      }
    });
  } catch (error) {
    console.error("Error validating coupon:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Get available coupons for user
router.get("/available", async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();

    const coupons = await Coupon.findAll({
      where: {
        isActive: true,
        [Op.or]: [
          { startDate: null },
          { startDate: { [Op.lte]: now } }
        ],
        [Op.or]: [
          { endDate: null },
          { endDate: { [Op.gte]: now } }
        ],
        [Op.or]: [
          { usageLimit: null },
          { usedCount: { [Op.lt]: sequelize.col('usageLimit') } }
        ]
      },
      attributes: ["id", "code", "name", "description", "type", "value", "minimumAmount", "maxDiscountAmount", "endDate"]
    });

    // Filter coupons based on per-user usage limit
    const availableCoupons = [];
    for (const coupon of coupons) {
      if (coupon.usageLimitPerUser) {
        const userUsageCount = await CouponUsage.count({
          where: { couponId: coupon.id, userId }
        });
        if (userUsageCount < coupon.usageLimitPerUser) {
          availableCoupons.push(coupon);
        }
      } else {
        availableCoupons.push(coupon);
      }
    }

    return res.status(200).json({
      message: "Available coupons fetched successfully",
      status: "success",
      data: availableCoupons
    });
  } catch (error) {
    console.error("Error fetching available coupons:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

export default router;