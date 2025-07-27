// controllers/user.controller.js
import { photoWork } from "../config/photoWork.js";
import { User, Auth } from "../models/index.model.js";
import { handleError } from "../utils/apiError.js";

import { sendMail } from "../config/sendEmail.js";
import { generateStrongPassword } from "../utils/tools.js";

// For self update and also by admin
export const updateUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    if (
      req.user.id !== userId &&
      req.user.role !== "admin" &&
      !req.user.permissions.includes("manageUsers")
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this user",
      });
    }

    const {
      firstName,
      lastName,
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

    // Use the updateProfile method from the model
    user.updateProfile({
      firstName: firstName ?? user.firstName,
      lastName: lastName ?? user.lastName,
      phone: phone ?? user.phone,
      dateOfBirth: dateOfBirth ?? user.dateOfBirth,
      gender: gender ?? user.gender,
      address: address ?? user.address,
      avatar: avatar ?? user.avatar,
    });

    await user.save();

    const userResponse = user.toJSON();

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
      !req.user.permissions.includes("manageUsers")
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

// Additional helper functions for the new schema

export const getUserByAuthId = async (req, res) => {
  try {
    const { authId } = req.params;

    const user = await User.findOne({
      where: { authId },
      include: [
        {
          model: Auth,
          as: "auth",
          attributes: {
            exclude: [
              "password",
              "passwordResetToken",
              "emailVerificationToken",
              "twoFactorSecret",
            ],
          },
        },
      ],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User fetched successfully",
      data: {
        user: user,
      },
    });
  } catch (error) {
    handleError(error, res);
  }
};

export const createUser = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      gender,
      role = "customer",
      permissions = [],
      province,
      city,
      fullAddress,
      googleId,
      provider = "email",
    } = req.body;

    const password = generateStrongPassword(10)

    const address =
      province && city && fullAddress
        ? {
            province,
            city,
            fullAddress,
          }
        : null;

    let avatar;

    if (req.files && req.files["avatar"]) {
      for (const file of req.files["avatar"]) {
        const photo = await photoWork(file);
        const image = {
          blurhash: photo.blurhash,
          url: photo.secure_url,
          height: photo.height,
          width: photo.width,
        };
        avatar = image;
      }
    }

    // Create Auth record first - emailVerified set to true for admin-created users
    const auth = await Auth.create({
      email,
      password,
      googleId,
      provider,
      emailVerified: true, // Always true for admin-created users
    });

    // Create User profile linked to Auth
    const newUser = await User.create({
      authId: auth.id,
      firstName,
      lastName,
      phone: phone ? phone : null,
      dateOfBirth: dateOfBirth || null,
      gender,
      role: role || "customer",
      permissions: permissions || [],
      address,
      avatar: avatar || null,
    });

    // Load the user with auth relationship
    const userWithAuth = await User.findByPk(newUser.id, {
      include: [
        {
          model: Auth,
          as: "auth",
          attributes: { exclude: ["password"] },
        },
      ],
    });

    // Send login credentials email
    const credentialsEmailOptions = {
      to: auth.email,
      subject: "🎉 Welcome! Your Account Has Been Created",
      html: `
    <div style="margin:0; padding:0; background:#f4f4f4; font-family:'Helvetica Neue', Arial, sans-serif;">
      <table align="center" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px; margin:auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 8px 30px rgba(0,0,0,0.08);">
        
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(90deg,#000000,#1a1a1a); color:#ffffff; padding:40px 30px; text-align:center;">
            <h2 style="margin:0; font-size:26px; letter-spacing:1px;">Account Created Successfully</h2>
            <p style="margin-top:10px; font-size:15px; font-style:italic; color:#ccc;">Welcome to <strong>${
              process.env.COMPANY_NAME
            }</strong></p>
          </td>
        </tr>
        
        <!-- Body -->
        <tr>
          <td style="padding:40px 30px;">
            <p style="font-size:16px; color:#333; margin-bottom:20px;">
              Hi <strong>${firstName} ${lastName}</strong>,
            </p>
            
            <p style="font-size:16px; color:#333; margin-bottom:20px;">
              Your account has been successfully created by our admin team. You can now access your account using the credentials below:
            </p>
            
            <!-- Credentials Box -->
            <div style="background:#f8f9fa; border:1px solid #e9ecef; border-radius:8px; padding:20px; margin:30px 0;">
              <h3 style="margin:0 0 15px 0; color:#333; font-size:18px;">Your Login Credentials</h3>
              <div style="margin-bottom:12px;">
                <strong style="color:#666; font-size:14px;">Email/Login ID:</strong>
                <div style="background:#fff; padding:8px 12px; border-radius:4px; border:1px solid #ddd; margin-top:4px; font-family:monospace; color:#333;">
                  ${email}
                </div>
              </div>
              <div style="margin-bottom:12px;">
                <strong style="color:#666; font-size:14px;">Password:</strong>
                <div style="background:#fff; padding:8px 12px; border-radius:4px; border:1px solid #ddd; margin-top:4px; font-family:monospace; color:#333;">
                  ${password}
                </div>
              </div>
            </div>
            
            <div style="text-align:center; margin: 40px 0;">
              <a href="${
                process.env.CLIENT_URL || "#"
              }/login" style="background-color:#ff3366; color:white; padding:14px 32px; font-size:16px; border-radius:8px; text-decoration:none; display:inline-block; font-weight:bold; box-shadow:0 4px 14px rgba(255,51,102,0.4);">
                🚀 Login to Your Account
              </a>
            </div>
            
            <div style="background:#fff3cd; border:1px solid #ffeaa7; border-radius:6px; padding:15px; margin:20px 0;">
              <p style="margin:0; font-size:14px; color:#856404;">
                <strong>🔒 Security Tip:</strong> For your security, we recommend changing your password after your first login.
              </p>
            </div>
            
            <p style="font-size:13px; color:#999; margin-top:30px;">
              If you have any questions or need assistance, please don't hesitate to contact our support team.
            </p>
          </td>
        </tr>
        
        <!-- Footer -->
        <tr>
          <td style="background:#fafafa; text-align:center; padding:20px; font-size:12px; color:#aaa;">
            &copy; ${new Date().getFullYear()} ${
        process.env.COMPANY_NAME
      }. All rights reserved.<br/>
            Stay fierce. Stay fashionable.
          </td>
        </tr>
      </table>
    </div>
  `,
    };

    // Send the credentials email
    await sendMail(credentialsEmailOptions);

    const userResponse = userWithAuth.toJSON();

    return res.status(201).json({
      success: true,
      message: "User created successfully and credentials sent via email",
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

    // Check if requesting user has permission to grant these permissions
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
      include: [
        {
          model: Auth,
          as: "auth",
          attributes: {
            exclude: [
              "password",
              "passwordResetToken",
              "emailVerificationToken",
              "twoFactorSecret",
            ],
          },
        },
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

export const updateUserPreferences = async (req, res) => {
  try {
    const { userId } = req.params;
    const { preferences } = req.body;

    if (req.user.id !== userId && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this user's preferences",
      });
    }

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Merge with existing preferences
    const updatedPreferences = {
      ...user.preferences,
      ...preferences,
    };

    await user.update({ preferences: updatedPreferences });

    return res.status(200).json({
      success: true,
      message: "Preferences updated successfully",
      data: {
        user: user,
      },
    });
  } catch (error) {
    handleError(error, res);
  }
};
