// controllers/user.controller.js
import { photoWork } from "../config/photoWork.js";
import { User } from "../models/index.model.js";
import { handleError } from "../utils/apiError.js";

// For self update and also by admin
export const updateUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    if (
      req.user.id !== userId &&
      req.user.role !== "admin" &&
      req.user.permissions.includes("updateUser") === false
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this user",
      });
    }

    const {
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      gender,
      province,
      city,
      fullAddress,
    } = req.body;

    let address = null;

    if (province && city && fullAddress) {
      address = {
        province: province ? province.trim() : null,
        city: city ? city.trim() : null,
        fullAddress: fullAddress ? fullAddress.trim() : null,
      };
    }

    let avatar;

    if (req.files && req.files["avatar"]) {
      for (const file of req.files["avatar"]) {
        const photo = await photoWork(file);
        avatar = {
          blurhash: photo.blurhash,
          url: photo.secure_url,
          public_id: photo.public_id,
          height: photo.height,
          width: photo.width,
        };
      }
    }

    const user = await User.findByPk(userId);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    await user.update({
      firstName: firstName ?? user.firstName,
      lastName: lastName ?? user.lastName,
      email: email ?? user.email,
      phone: phone ?? user.phone,
      dateOfBirth: dateOfBirth ?? user.dateOfBirth,
      gender: gender ?? user.gender,
      address: address ?? user.address,
      avatar: avatar ?? user.avatar,
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

export const updateUserAvatar = async (req, res) => {
  try {
    const { userId } = req.params;

    // Authorization check
    if (
      req.user.id !== userId &&
      req.user.role !== "admin" &&
      req.user.permissions.includes("updateUser") === false
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this user's avatar",
      });
    }

    // Ensure avatar file is provided
    if (
      !req.files ||
      !req.files["avatar"] ||
      req.files["avatar"].length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "No avatar image provided",
      });
    }

    // Process the uploaded avatar
    const file = req.files["avatar"][0];
    const photo = await photoWork(file);

    const avatar = {
      blurhash: photo.blurhash,
      url: photo.secure_url,
      public_id: photo.public_id,
      height: photo.height,
      width: photo.width,
    };

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    await user.update({ avatar });

    const userResponse = user.toJSON();
    delete userResponse.password;

    return res.status(200).json({
      success: true,
      message: "Avatar updated successfully",
      data: {
        user: userResponse,
      },
    });
  } catch (error) {
    handleError(error, res);
  }
};

// *********************************************************************************************

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
      province,
      city,
      fullAddress,
    } = req.body;

    const address = {
      province,
      city,
      fullAddress,
    };

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


export const updateUserPermissions = async (req, res) => {
  try {
    const { userId } = req.params;

    const { permissions } = req.body;

    const unauthorized = permissions.filter(
      (p) => !req.user.permissions.includes(p)
    );

    if (unauthorized.length > 0) {
      return res.status(403).json({
        success: false,
        message: `Unauthorized permissions: ${unauthorized.join(", ")}`,
      });
    }

    const user = await User.findByPk(userId);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    await user.update({
      permissions: permissions,
    });

    const userResponse = user.toJSON();
    delete userResponse.password;

    return res.status(200).json({
      success: true,
      message: "Permissions updated successfully",
      data: {
        user: userResponse,
      },
    });
  } catch (error) {
    handleError(error, res);
  }
};

// Get user profile by id and also get cart, orders, reviews, and wishlist items
export const getUserProfile = async (req, res) => {
  try {
    const userId = req.params.userId;

    const user = await User.findByPk(userId, {
      attributes: { exclude: ["password"] },
      include: [
        {
          association: "orders",
        },
        {
          association: "cartItems",
        },
        {
          association: "reviews",
        },
        {
          association: "wishlistItems",
        },
      ],
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
