// controllers/auth.controller.js
import jwt from "jsonwebtoken";
import { Auth, User } from "../models/index.model.js";
import { sendMail } from "../config/sendEmail.js";

// Helper function to generate JWT tokens
const generateTokens = (authId, userId) => {
  const accessToken = jwt.sign({ authId, userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "15m",
  });

  const refreshToken = jwt.sign(
    { authId, userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d" }
  );

  return { accessToken, refreshToken };
};

// Register with email and password
export const registerWithEmail = async (req, res) => {
  const transaction = await Auth.sequelize.transaction();

  try {
    const {
      email,
      password,
      firstName,
      lastName,
      phone,
      address,
      gender,
      dateOfBirth,
    } = req.body;

    // Create auth record
    const auth = await Auth.create(
      {
        email,
        password,
        provider: "email",
      },
      { transaction }
    );

    // Create user profile
    const user = await User.create(
      {
        authId: auth.id,
        firstName,
        lastName,
        phone,
        address,
        gender,
        dateOfBirth,
      },
      { transaction }
    );

    await transaction.commit();

    // Send verification email
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${auth.emailVerificationToken}`;

    const emailOptions = {
      to: auth.email,
      subject: "Verify Your Email Address",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to ${process.env.COMPANY_NAME}!</h2>
          <p>Thank you for registering. Please verify your email address by clicking the link below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a>
          </div>
          <p>Or copy and paste this link in your browser:</p>
          <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
          <p>This link will expire in 24 hours.</p>
          <p>If you didn't create this account, please ignore this email.</p>
        </div>
      `,
    };

    sendMail(emailOptions);

    res.status(201).json({
      success: true,
      message:
        "Registration successful. Please check your email to verify your account.",
      data: {
        auth: {
          id: auth.id,
          email: auth.email,
          emailVerified: auth.emailVerified,
          provider: auth.provider,
        },
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          isProfileComplete: user.isProfileComplete,
        },
      },
    });
  } catch (error) {
    await transaction.rollback();

    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Login with email and password
export const loginWithEmail = async (req, res) => {
  try {
    const { email, password } = req.body;

    const auth = await Auth.scope("active").findOne({
      where: { email, provider: "email" },
      include: [{ model: User, as: "profile" }],
    });

    if (!auth) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (auth.isSuspended) {
      return res.status(403).json({
        success: false,
        message: "Account is suspended",
      });
    }

    // Check if account is locked
    if (auth.lockedUntil && new Date() < auth.lockedUntil) {
      const lockTimeLeft = Math.ceil(
        (auth.lockedUntil - new Date()) / 1000 / 60
      );
      return res.status(423).json({
        success: false,
        message: `Account is locked. Try again in ${lockTimeLeft} minutes.`,
      });
    }

    const isValidPassword = await auth.checkPassword(password);

    if (!isValidPassword) {
      // Increment failed attempts
      auth.loginAttempts += 1;

      // Lock account after 5 failed attempts
      if (auth.loginAttempts >= 5) {
        auth.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      }

      await auth.save();
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Reset failed attempts on successful login
    auth.loginAttempts = 0;
    auth.lockedUntil = null;
    auth.updateLastLogin();
    await auth.save();

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(
      auth.id,
      auth.profile.id
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        auth: {
          id: auth.id,
          email: auth.email,
          emailVerified: auth.emailVerified,
          provider: auth.provider,
        },
        user: auth.profile,
        tokens: {
          accessToken,
          refreshToken,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Google OAuth callback
export const authenticateWithGoogle = async (req, res) => {
  try {
    const { googleProfile } = req.body;
    const { id: googleId, emails, name, photos } = googleProfile;
    const email = emails[0].value;

    let auth = await Auth.findOne({
      where: { googleId },
      include: [{ model: User, as: "profile" }],
    });

    if (auth) {
      // Existing Google user - update last login
      auth.updateLastLogin();
      await auth.save();

      const { accessToken, refreshToken } = generateTokens(
        auth.id,
        auth.profile.id
      );

      return res.status(200).json({
        success: true,
        message: "Login successful",
        data: {
          auth: {
            id: auth.id,
            email: auth.email,
            emailVerified: auth.emailVerified,
            provider: auth.provider,
          },
          user: auth.profile,
          tokens: {
            accessToken,
            refreshToken,
          },
          isNewUser: false,
        },
      });
    }

    // Check if email exists with different provider
    auth = await Auth.findOne({
      where: { email },
      include: [{ model: User, as: "profile" }],
    });

    if (auth && auth.provider === "email") {
      return res.status(400).json({
        success: false,
        message:
          "An account with this email already exists. Please sign in with email and password.",
      });
    }

    // Create new Google user
    const transaction = await Auth.sequelize.transaction();

    try {
      auth = await Auth.create(
        {
          email,
          googleId,
          provider: "google",
          emailVerified: true,
          emailVerifiedAt: new Date(),
          lastLoginAt: new Date(),
        },
        { transaction }
      );

      const user = await User.create(
        {
          authId: auth.id,
          firstName: name.givenName || "User",
          lastName: name.familyName || "",
          avatar:
            photos && photos[0]
              ? {
                  url: photos[0].value,
                  height: 200,
                  width: 200,
                  blurhash: "default",
                }
              : null,
        },
        { transaction }
      );

      await transaction.commit();

      const { accessToken, refreshToken } = generateTokens(auth.id, user.id);

      res.status(201).json({
        success: true,
        message: "Registration and login successful",
        data: {
          auth: {
            id: auth.id,
            email: auth.email,
            emailVerified: auth.emailVerified,
            provider: auth.provider,
          },
          user,
          tokens: {
            accessToken,
            refreshToken,
          },
          isNewUser: true,
        },
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Refresh access token
export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token is required",
      });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(
      decoded.authId,
      decoded.userId
    );

    res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      data: {
        tokens: {
          accessToken,
          refreshToken: newRefreshToken,
        },
      },
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Invalid or expired refresh token",
    });
  }
};

// Send email verification
export const sendEmailVerification = async (req, res) => {
  try {
    const { authId } = req.user; // From auth middleware

    const auth = await Auth.findOne({
      where: { id: authId },
    });

    if (!auth) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (auth.emailVerified) {
      return res.status(400).json({
        success: false,
        message: "Email is already verified",
      });
    }

    auth.generateVerificationToken();
    await auth.save();

    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${auth.emailVerificationToken}`;

    const emailOptions = {
      to: auth.email,
      subject: "Verify Your Email Address",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Email Verification</h2>
          <p>Please verify your email address by clicking the link below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a>
          </div>
          <p>Or copy and paste this link in your browser:</p>
          <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
          <p>This link will expire in 24 hours.</p>
        </div>
      `,
    };

    sendMail(emailOptions);

    res.status(200).json({
      success: true,
      message: "Verification email sent successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Verify email
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;

    const auth = await Auth.findOne({
      where: { emailVerificationToken: token },
    });

    if (!auth) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification token",
      });
    }

    if (!auth.isEmailVerificationTokenValid()) {
      return res.status(400).json({
        success: false,
        message: "Verification token has expired",
      });
    }

    auth.markEmailAsVerified();
    await auth.save();

    res.status(200).json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Request password reset
export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    const auth = await Auth.findOne({
      where: { email, provider: "email" },
    });

    if (!auth) {
      // Don't reveal if email exists for security
      return res.status(200).json({
        success: true,
        message: "If the email exists, a reset link has been sent",
      });
    }

    const resetToken = auth.generatePasswordResetToken();
    await auth.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const emailOptions = {
      to: auth.email,
      subject: "Password Reset Request",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset</h2>
          <p>You requested a password reset. Click the link below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
          </div>
          <p>Or copy and paste this link in your browser:</p>
          <p style="word-break: break-all; color: #666;">${resetUrl}</p>
          <p>This link will expire in 10 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      `,
    };

    sendMail(emailOptions);

    res.status(200).json({
      success: true,
      message: "If the email exists, a reset link has been sent",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Reset password
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const auth = await Auth.findOne({
      where: { passwordResetToken: token },
    });

    if (!auth) {
      return res.status(400).json({
        success: false,
        message: "Invalid reset token",
      });
    }

    if (!auth.isPasswordResetTokenValid()) {
      return res.status(400).json({
        success: false,
        message: "Reset token has expired",
      });
    }

    auth.password = newPassword;
    auth.clearPasswordResetToken();
    await auth.save();

    res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Change password
export const changePassword = async (req, res) => {
  try {
    const { authId } = req.user; // From auth middleware
    const { currentPassword, newPassword } = req.body;

    const auth = await Auth.findOne({
      where: { id: authId },
    });

    if (!auth || auth.provider !== "email") {
      return res.status(400).json({
        success: false,
        message: "Invalid operation",
      });
    }

    const isValidPassword = await auth.checkPassword(currentPassword);
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    auth.password = newPassword;
    await auth.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get current user
export const getCurrentUser = async (req, res) => {
  try {
    const { authId } = req.user; // From auth middleware

    const auth = await Auth.findOne({
      where: { id: authId },
      include: [{ model: User, as: "profile" }],
      attributes: {
        exclude: [
          "password",
          "passwordResetToken",
          "emailVerificationToken",
          "twoFactorSecret",
        ],
      },
    });

    if (!auth) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        auth: {
          id: auth.id,
          email: auth.email,
          emailVerified: auth.emailVerified,
          provider: auth.provider,
          isActive: auth.isActive,
          isSuspended: auth.isSuspended,
          lastLoginAt: auth.lastLoginAt,
        },
        user: auth.profile,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Logout (client-side token invalidation)
export const logout = async (req, res) => {
  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};

// Suspend user account (Admin only)
export const suspendAccount = async (req, res) => {
  try {
    const { authId } = req.params;
    const { reason } = req.body;

    const auth = await Auth.findOne({
      where: { id: authId },
    });

    if (!auth) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    auth.isSuspended = true;
    auth.suspendedAt = new Date();
    auth.suspensionReason = reason || "Account suspended by administrator";
    await auth.save();

    res.status(200).json({
      success: true,
      message: "Account suspended successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Reactivate user account (Admin only)
export const reactivateAccount = async (req, res) => {
  try {
    const { authId } = req.params;

    const auth = await Auth.findOne({
      where: { id: authId },
    });

    if (!auth) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    auth.isSuspended = false;
    auth.suspendedAt = null;
    auth.suspensionReason = null;
    await auth.save();

    res.status(200).json({
      success: true,
      message: "Account reactivated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
