import jwt from "jsonwebtoken";
import { Auth, User, AuthToken } from "../models/index.model.js"; // Adjust import path as needed
import crypto from "crypto";





export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

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

    if (!authToken || authToken.isExpired()) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
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
      message: "Authentication error",
    });
  }
};





// export const authMiddleware = async (req, res, next) => {
//   try {
//     const token = req.header("Authorization")?.replace("Bearer ", "");

//     if (!token) {
//       return res.status(401).json({
//         success: false,
//         message: "Access token required",
//       });
//     }

//     const decoded = jwt.verify(token, process.env.JWT_SECRET);

//     // Verify user still exists and is active
//     const auth = await Auth.findOne({
//       where: { id: decoded.authId },
//       include: [{ model: User, as: "profile" }],
//     });

//     if (!auth || !auth.isActive || auth.isSuspended) {
//       return res.status(401).json({
//         success: false,
//         message: "Invalid token or account suspended",
//       });
//     }

//     req.user = {
//       authId: auth.id,
//       userId: auth.profile.id,

//       // UserId and id are the same but in some apis we have used req.id too so we kept it

//       id: auth.profile.id,
//       email: auth.email,
//       role: auth.profile.role,
//       permissions: auth.profile.permissions,
//     };

//     next();
//   } catch (error) {
//     if (error.name === "JsonWebTokenError") {
//       return res.status(401).json({
//         success: false,
//         message: "Invalid token",
//       });
//     }

//     if (error.name === "TokenExpiredError") {
//       return res.status(401).json({
//         success: false,
//         message: "Token expired",
//       });
//     }

//     res.status(500).json({
//       success: false,
//       message: "Authentication error",
//     });
//   }
// };





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
