// controllers/user.controller.js
import { photoWork } from "../config/photoWork.js";
import { User } from "../models/index.model.js";
import { handleError } from "../utils/apiError.js";

const createUserExample = {
  clerkUserId: "user_2abc123def453",
  firstName: "         Photo        ",
  lastName: "Test         ",
  email: "            john121.doe@example.com",
  password: "securePassword123",
  phone: "+1234567890       ",
  dateOfBirth: "1990-05-15",
  gender: "male",
  // role: "customer",
  permissions: [],
  address: {
    province: "California",
    city: "Los Angeles",
    fullAddress: "123 Main Street, Apt 4B, Los Angeles, CA 90210",
  },
};

export const createUser = async (req, res) => {
  try {
    const {
      clerkUserId,
      firstName,
      lastName,
      email,
      password,
      phone,
      dateOfBirth,
      gender,
      role = "customer",
      permissions = [],
      address,
    } = createUserExample;

    let avatar;

    if (req.files && req.files["avatar"]) {
      for (const file of req.files["avatar"]) {
        const photo = await photoWork(file);
        const image = {
          blurhash: photo.blurhash,
          url: photo.secure_url,
          public_id: photo.public_id,
          height: photo.height,
          width: photo.width,
        };
        avatar = image;
      }
    }

    // Create new user
    const newUser = await User.create({
      clerkUserId,
      firstName,
      lastName,
      email,
      password,
      phone: phone ? phone : null,
      dateOfBirth: dateOfBirth || null,
      gender,
      role: role || "customer",
      permissions: permissions || [],
      address,
      avatar: avatar || null,
      emailVerified: false,
    });

    const userResponse = newUser.toJSON();
    delete userResponse.password;

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      data: {
        user: userResponse,
      },
    });
  } catch (error) {
    handleError(error, res);
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const userId = req.params.userId;

    const user = await User.findByPk(userId, {
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
        status: "error",
      });
    }

    return res.status(200).json({
      message: "Profile fetched successfully",
      status: "success",
      data: user,
    });
  } catch (error) {
    handleError(error, res);
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const { userId } = req.params; 

    const {

      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      gender,
      role = "customer",
      permissions = [],
      address,


    } = req.body; 

    let avatar;

    if (req.files && req.files["avatar"]) {
      for (const file of req.files["avatar"]) {
        const photo = await photoWork(file);
        const image = {
          blurhash: photo.blurhash,
          url: photo.secure_url,
          public_id: photo.public_id,
          height: photo.height,
          width: photo.width,
        };
        avatar = image;
      }
    }

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    await user.update({
      firstName,
      lastName,
      email,
      phone: phone || null,
      dateOfBirth: dateOfBirth || null,
      gender,
      role,
      permissions,
      address,
      avatar: avatar || user.avatar,
    });

    const userResponse = user.toJSON();
    delete userResponse.password;

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: {
        user: userResponse,
      },
    });
  } catch (error) {
    handleError(error, res);
  }
};

