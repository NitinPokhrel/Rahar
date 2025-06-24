import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";  // Assuming User is the default export from the model file

const verifyJWT = asyncHandler(async (req, _, next) => {
  try {
    // Extract token from cookies or authorization header
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, "Unauthorized request: No token provided");
    }

    // Verify token using the secret
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // Find the user by primary key (id)
    const user = await User.findByPk(decodedToken?.id, {
      attributes: { exclude: ["passwordHash", "refreshToken"] },  // Exclude sensitive fields
    });

    if (!user) {
      throw new ApiError(401, "Invalid access token: User not found");
    }

    
    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new ApiError(401, "Access token expired");
    }
    if (error.name === "JsonWebTokenError") {
      throw new ApiError(401, "Invalid access token");
    }
    throw new ApiError(401, error.message || "Unauthorized request");
  }
});

export { verifyJWT };