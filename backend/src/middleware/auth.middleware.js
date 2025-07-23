// middleware/auth.middleware.js
import jwt from "jsonwebtoken";
import { Auth, User } from "../models/index.model.js";

export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access token required",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verify user still exists and is active
    const auth = await Auth.findOne({
      where: { id: decoded.authId },
      include: [{ model: User, as: "profile" }],
    });

    if (!auth || !auth.isActive || auth.isSuspended) {
      return res.status(401).json({
        success: false,
        message: "Invalid token or account suspended",
      });
    }

    req.user = {
      authId: auth.id,
      userId: auth.profile.id,
      email: auth.email,
      role: auth.profile.role,
      permissions: auth.profile.permissions,
    };

    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired",
      });
    }

    res.status(500).json({
      success: false,
      message: "Authentication error",
    });
  }
};

export const adminMiddleware = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Admin access required",
    });
  }
  next();
};

// Middleware to check specific permissions
export const permissionMiddleware = (requiredPermission) => {
  return (req, res, next) => {
    if (
      req.user.role === "admin" &&
      req.user.permissions.includes(requiredPermission)
    ) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `${requiredPermission} permission required`,
    });
  };
};
