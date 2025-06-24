import User from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js"; 
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken"


const generateAccessAndRefereshTokens = async(userId) =>{
    
  try {
      const user = await User.findByPk(userId)
      const accessToken = await user.generateAccessToken()
      const refreshToken = await user.generateRefreshToken()
      
      user.refreshToken = refreshToken;
      await user.save({ validate: false })

      
      return {accessToken, refreshToken}


  } catch (error) {
      throw new ApiError(500, "Something went wrong while generating referesh and access token")
  }
}

const registerUser = async (req, res, next) => {
  try {
    const { displayName, email, password, confirmPassword, phoneNumber } =
      req.body;

    if (
      [email, password, confirmPassword].some((field) => field.trim() === "")
    ) {
      throw new ApiError(400, "All fields are required");
    }

    if (password !== confirmPassword) {
      throw new ApiError(400, "Password and confirm password must match");
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw new ApiError(409, "User with this email already exists");
    }

    // Create new user
    const user = await User.create({
      displayName,
      email,
      passwordHash: password, // The hook will hash the password
      phoneNumber,
    });


    // await user.save({ validate: false });

    return res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user.id,
        displayName: user.displayName,
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
};



const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
  
  
  if (!incomingRefreshToken) {
      throw new ApiError(401, "unauthorized request")
  }

  try {
      const decodedToken = jwt.verify(
          incomingRefreshToken,
          process.env.REFRESH_TOKEN_SECRET
      )
  
      const user = await User.findByPk(decodedToken?.id);
  
      if (!user) {
          throw new ApiError(401, "Invalid refresh token")
      }

      if (incomingRefreshToken !== user?.refreshToken) {
          throw new ApiError(401, "Refresh token is expired or used")
          
      }

      return res
      .status(200)
      .json(
          new ApiResponse(
              200, 
              user.id,
              "user is authorize"
          )
      )
  } catch (error) {
      throw new ApiError(401, error?.message || "Invalid refresh token")
  }

})





export { registerUser  };