import jwt from "jsonwebtoken";
import { Auth, User, AuthToken } from "../models/index.model.js";
import crypto from "crypto";

export const authMiddleware = async (req, res, next) => {
  try {

    const token = req.cookies.accessToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access token required",
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Hash the token to compare with database
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Find the token in database and verify it's active
    const authToken = await AuthToken.findOne({
      where: {
        accessToken: hashedToken,
        authId: decoded.authId,
        isActive: true,
      },
      include: [
        {
          model: Auth,
          as: "auth",
          include: [{ model: User, as: "profile" }],
        },
      ],
    });

    // Check if token exists in database
    if (!authToken) {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    // Validate token ownership (now that authToken is defined)
    if (decoded.authId !== authToken.auth.id) {
      return res.status(401).json({
        success: false,
        status: "Not authorized",
        message: "Token mismatch",
      });
    }

    // Check if token is expired
    if (authToken.isExpired()) {
      return res.status(401).json({
        success: false,
        message: "Expired token",
      });
    }

    // Verify user still exists and is active
    if (
      !authToken.auth ||
      !authToken.auth.isActive ||
      authToken.auth.isSuspended
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid token or account suspended",
      });
    }

    // Update last used timestamp
    authToken.updateLastUsed();
    await authToken.save();

    // Set user info in request
    req.user = {
      authId: authToken.auth.id,
      userId: authToken.auth.profile.id,
      // UserId and id are the same but in some apis we have used req.id too so we kept it
      id: authToken.auth.profile.id,
      email: authToken.auth.email,
      role: authToken.auth.profile.role,
      permissions: authToken.auth.profile.permissions,
      tokenId: authToken.id, // For logout functionality
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
      message: error.message || "Internal server error",
    });
  }
};

export const adminMiddleware = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      status: "Not authorized",
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
      status: "Not authorized",
      message: `${requiredPermission} permission required to perform this action`,
    });
  };
};
