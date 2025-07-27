import jwt from "jsonwebtoken";
import { sendMail } from "../config/sendEmail.js";
import { Auth, User, AuthToken } from "../models/index.model.js";
import crypto from "crypto";

// Helper function to get device info from request
const getDeviceInfo = (req) => {
  const userAgent = req.headers["user-agent"] || "";
  const ip =
    req.ip ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    (req.connection.socket ? req.connection.socket.remoteAddress : null);

  // Parse user agent for basic device info
  const deviceInfo = {
    browser: "Unknown",
    os: "Unknown",
    device: "Unknown",
  };

  // Basic user agent parsing (you might want to use a library like 'ua-parser-js' for better parsing)
  if (userAgent.includes("Chrome")) deviceInfo.browser = "Chrome";
  else if (userAgent.includes("Firefox")) deviceInfo.browser = "Firefox";
  else if (userAgent.includes("Safari")) deviceInfo.browser = "Safari";
  else if (userAgent.includes("Edge")) deviceInfo.browser = "Edge";

  if (userAgent.includes("Windows")) deviceInfo.os = "Windows";
  else if (userAgent.includes("Mac")) deviceInfo.os = "macOS";
  else if (userAgent.includes("Linux")) deviceInfo.os = "Linux";
  else if (userAgent.includes("Android")) deviceInfo.os = "Android";
  else if (userAgent.includes("iOS")) deviceInfo.os = "iOS";

  if (userAgent.includes("Mobile")) deviceInfo.device = "Mobile";
  else if (userAgent.includes("Tablet")) deviceInfo.device = "Tablet";
  else deviceInfo.device = "Desktop";

  return {
    deviceInfo,
    ipAddress: ip,
    userAgent,
  };
};

// Helper function to generate and store tokens
const generateAndStoreTokens = async (authId, userId, req) => {
  const deviceData = getDeviceInfo(req);

  // Generate JWT tokens
  const accessToken = jwt.sign({ authId, userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "5m",
  });

  const refreshToken = jwt.sign(
    { authId, userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d" }
  );

  // Calculate expiration dates
  const accessTokenExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
  const refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  // Store tokens in database
  const authToken = await AuthToken.create({
    authId,
    accessToken: crypto.createHash("sha256").update(accessToken).digest("hex"),
    refreshToken: crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex"),
    expiresAt: accessTokenExpiry,
    refreshExpiresAt: refreshTokenExpiry,
    ...deviceData,
    loginAt: new Date(),
    lastUsedAt: new Date(),
  });

  return {
    accessToken,
    refreshToken,
    tokenId: authToken.id,
    deviceInfo: deviceData.deviceInfo,
  };
};

// Helper function to set cookies based on environment
const setCookies = (res, tokens) => {
  const isProduction = process.env.NODE_ENV === "production";

  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "strict" : "lax",
    path: "/api/v1/auth/refresh-token",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };

  const cookieOptions2 = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "strict" : "lax",
    path: "/",
    maxAge: 1 * 60 * 60 * 1000, // 1 hour
  };

  res.cookie("refreshToken", tokens.refreshToken, cookieOptions);
  res.cookie("accessToken", tokens.accessToken, cookieOptions2);
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
        status: "Login failed",
        message: "Invalid email or password",
      });
    }

    if (auth.isSuspended) {
      return res.status(403).json({
        success: false,
        status: "Login failed",
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
        status: "Login failed",
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
        status: "Login failed",
        message: "Invalid email or password",
      });
    }

    // Reset failed attempts on successful login
    auth.loginAttempts = 0;
    auth.lockedUntil = null;
    auth.updateLastLogin();
    await auth.save();

    // Generate and store tokens
    const tokens = await generateAndStoreTokens(auth.id, auth.profile.id, req);

    // Set refresh token as httpOnly cookie
    setCookies(res, tokens);

    res.status(200).json({
      success: true,
      status: "Login successful",
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
          accessToken: tokens.accessToken,
        },
        device: {
          tokenId: tokens.tokenId,
          deviceInfo: tokens.deviceInfo,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: "Login failed",
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

      const tokens = await generateAndStoreTokens(
        auth.id,
        auth.profile.id,
        req
      );
      setCookies(res, tokens);

      return res.status(200).json({
        success: true,
        status: "Login successful",
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
            accessToken: tokens.accessToken,
          },
          device: {
            tokenId: tokens.tokenId,
            deviceInfo: tokens.deviceInfo,
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
        status: "Registration failed",
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

      const tokens = await generateAndStoreTokens(auth.id, user.id, req);
      setCookies(res, tokens);

      res.status(201).json({
        success: true,
        status: "Registration and login successful",
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
            accessToken: tokens.accessToken,
          },
          device: {
            tokenId: tokens.tokenId,
            deviceInfo: tokens.deviceInfo,
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
      status: "Registration failed",
      message: error.message,
    });
  }
};

// Refresh access token
export const refreshToken = async (req, res) => {
  try {
    console.log(req.cookies);

    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        status: "Token refresh failed",
        message: "Refresh token is required",
      });
    }

    // Hash the refresh token to compare with database
    const hashedRefreshToken = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");

    // Find the token in database
    const authToken = await AuthToken.findOne({
      where: {
        refreshToken: hashedRefreshToken,
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

    if (!authToken || authToken.isRefreshExpired()) {
      return res.status(401).json({
        success: false,
        status: "Token refresh failed",
        message: "Invalid or expired refresh token",
      });
    }

    // Check if auth account is still active
    if (!authToken.auth.isActive || authToken.auth.isSuspended) {
      return res.status(401).json({
        success: false,
        status: "Token refresh failed",
        message: "Account is suspended or inactive",
      });
    }

    // Generate new tokens
    const newTokens = await generateAndStoreTokens(
      authToken.auth.id,
      authToken.auth.profile.id,
      req
    );

    // Deactivate old token
    authToken.isActive = false;
    await authToken.save();

    // Set new refresh token cookie
    setCookies(res, newTokens);

    res.status(200).json({
      success: true,
      status: "Token refreshed successfully",
      message: "Token refreshed successfully",
      data: {
        tokens: {
          accessToken: newTokens.accessToken,
        },
        device: {
          tokenId: newTokens.tokenId,
          deviceInfo: newTokens.deviceInfo,
        },
      },
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      status: "Token refresh failed",
      message: "Invalid or expired refresh token",
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
        status: "Change password failed",
        message: "Invalid operation",
      });
    }

    const isValidPassword = await auth.checkPassword(currentPassword);
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        status: "Change password failed",
        message: "Current password is incorrect",
      });
    }

    // Update password (this will trigger the hook to clear all tokens)
    auth.password = newPassword;
    await auth.save();

    // Clear refresh token cookie
    res.clearCookie("refreshToken");

    res.status(200).json({
      success: true,
      status: "Password changed successfully",
      message:
        "Password changed successfully. Please login again on all devices.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: "Change password failed",
      message: error.message,
    });
  }
};

// Logout from current device
export const logout = async (req, res) => {
  try {
    const { tokenId } = req.user; // From auth middleware

    if (tokenId) {
      await AuthToken.update({ isActive: false }, { where: { id: tokenId } });
    }

    // Clear refresh token cookie
    res.clearCookie("refreshToken");

    res.status(200).json({
      success: true,
      status: "Logout successful",
      message: "Logged out successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: "Logout failed",
      message: error.message,
    });
  }
};

// Logout from specific device (requires password)
export const logoutDevice = async (req, res) => {
  try {
    const { authId } = req.user;
    const { tokenId, password } = req.body;

    // Verify password
    const auth = await Auth.findOne({ where: { id: authId } });

    if (auth.provider === "email") {
      const isValidPassword = await auth.checkPassword(password);
      if (!isValidPassword) {
        return res.status(400).json({
          success: false,
          status: "Logout failed",
          message: "Invalid password",
        });
      }
    }

    // Deactivate specific token
    const result = await AuthToken.update(
      { isActive: false },
      {
        where: {
          id: tokenId,
          authId: authId,
        },
      }
    );

    if (result[0] === 0) {
      return res.status(404).json({
        success: false,
        status: "Logout failed",
        message: "Device session not found",
      });
    }

    res.status(200).json({
      success: true,
      status: "Device logout successful",
      message: "Device logged out successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: "Logout failed",
      message: error.message,
    });
  }
};

// Get active sessions/devices
export const getActiveSessions = async (req, res) => {
  try {
    const { authId } = req.user;

    const sessions = await AuthToken.findAll({
      where: {
        authId: authId,
        isActive: true,
      },
      attributes: [
        "id",
        "deviceInfo",
        "ipAddress",
        "loginAt",
        "lastUsedAt",
        "location",
      ],
      order: [["lastUsedAt", "DESC"]],
    });

    res.status(200).json({
      success: true,
      status: "Sessions retrieved successfully",
      message: "Active sessions retrieved successfully",
      data: {
        sessions: sessions.map((session) => ({
          tokenId: session.id,
          deviceInfo: session.deviceInfo,
          ipAddress: session.ipAddress,
          loginAt: session.loginAt,
          lastUsedAt: session.lastUsedAt,
          location: session.location,
          isCurrent: session.id === req.user.tokenId,
        })),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: "Failed to retrieve sessions",
      message: error.message,
    });
  }
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
      subject: "Confirm Your Email to Start Shopping in Style!",
      html: `
    <div style="background-color: #f9f9f9; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; padding: 40px 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 5px 25px rgba(0,0,0,0.08);">
        <div style="background-color: #000; color: #fff; padding: 30px 40px;">
          <h1 style="margin: 0; font-size: 28px; letter-spacing: 1px;">Welcome to ${
            process.env.COMPANY_NAME
          }</h1>
          <p style="margin-top: 10px; font-size: 16px;">Where fashion meets your style.</p>
        </div>

        <div style="padding: 30px 40px;">
          <p style="font-size: 16px; margin-bottom: 20px;">
            Hi there! We're thrilled to have you on board. To start exploring the latest trends and exclusive deals, please verify your email address.
          </p>

          <div style="text-align: center; margin: 40px 0;">
            <a href="${verificationUrl}" style="background-color: #ff3366; color: #fff; font-size: 16px; font-weight: bold; padding: 14px 28px; border-radius: 6px; text-decoration: none; box-shadow: 0 4px 14px rgba(255, 51, 102, 0.3);">
              Verify My Email
            </a>
          </div>

          <p style="font-size: 14px; color: #777;">Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; font-size: 13px; color: #555; background-color: #f1f1f1; padding: 10px; border-radius: 6px;">
            ${verificationUrl}
          </p>

          <p style="font-size: 13px; color: #999; margin-top: 30px;">
            This link will expire in 24 hours for your security.
          </p>
          <p style="font-size: 13px; color: #999;">
            If you didn’t sign up for an account, feel free to ignore this email.
          </p>
        </div>

        <div style="background-color: #fafafa; padding: 20px 40px; text-align: center; font-size: 12px; color: #aaa;">
          &copy; ${new Date().getFullYear()} ${
        process.env.COMPANY_NAME
      }. All rights reserved.<br>
          Fashion never sleeps — and neither do we.
        </div>
      </div>
    </div>
  `,
    };

    sendMail(emailOptions);

    res.status(201).json({
      success: true,
      status: "Registration successful",
      message: "Please check your email to verify your account.",
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
        status: "Registration failed",
        message: "Email already exists",
      });
    }

    res.status(400).json({
      success: false,
      status: "Registration failed",
      message: error.message,
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
        status: "Verification failed",
        message: "User not found",
      });
    }

    if (auth.emailVerified) {
      return res.status(400).json({
        success: false,
        status: "Verification failed",
        message: "Email is already verified",
      });
    }

    auth.generateVerificationToken();
    await auth.save();

    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${auth.emailVerificationToken}`;

    const emailOptions = {
      to: auth.email,
      subject: "✨ Verify Your Email to Unlock Exclusive Fashion Drops",
      html: `
    <div style="margin:0; padding:0; background:#f4f4f4; font-family:'Helvetica Neue', Arial, sans-serif;">
      <table align="center" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px; margin:auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 8px 30px rgba(0,0,0,0.08);">
        
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(90deg,#000000,#1a1a1a); color:#ffffff; padding:40px 30px; text-align:center;">
            <h2 style="margin:0; font-size:26px; letter-spacing:1px;">Confirm Your Email</h2>
            <p style="margin-top:10px; font-size:15px; font-style:italic; color:#ccc;">Let the shopping begin at <strong>${
              process.env.COMPANY_NAME
            }</strong></p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px 30px;">
            <p style="font-size:16px; color:#333; margin-bottom:20px;">
              Thanks for joining us! You're one click away from stepping into a world of trendsetting fashion.
            </p>

            <p style="font-size:16px; color:#333; margin-bottom:30px;">
              Please verify your email by clicking the button below:
            </p>

            <div style="text-align:center; margin: 40px 0;">
              <a href="${verificationUrl}" style="background-color:#ff3366; color:white; padding:14px 32px; font-size:16px; border-radius:8px; text-decoration:none; display:inline-block; font-weight:bold; box-shadow:0 4px 14px rgba(255,51,102,0.4);">
                ✅ Verify Email Now
              </a>
            </div>

            <p style="font-size:14px; color:#666; margin-bottom:8px;">Or copy and paste this link into your browser:</p>
            <p style="font-size:13px; color:#888; background:#f1f1f1; padding:10px; border-radius:6px; word-break:break-word;">
              ${verificationUrl}
            </p>

            <p style="font-size:13px; color:#999; margin-top:30px;">
              This link will expire in <strong>24 hours</strong> for security reasons.
              If you didn’t request this, you can safely ignore it.
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

    sendMail(emailOptions);

    res.status(200).json({
      success: true,
      message: "Verification email sent successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: "Verification failed",
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
        status: "Verification failed",
        message: "Invalid verification token",
      });
    }

    if (!auth.isEmailVerificationTokenValid()) {
      return res.status(400).json({
        success: false,
        status: "Verification failed",
        message: "Verification token has expired",
      });
    }

    auth.markEmailAsVerified();
    await auth.save();

    res.status(200).json({
      success: true,
      status: "Email verified successfully",
      message: "Email verified successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: "Verification failed",
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
        status: "Password reset requested",
        message: "If the email exists, a reset link has been sent",
      });
    }

    const resetToken = auth.generatePasswordResetToken();
    await auth.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const emailOptions = {
      to: auth.email,
      subject: "🛡️ Reset Your Password Securely",
      html: `
    <div style="margin:0; padding:0; background:#f4f4f4; font-family:'Helvetica Neue', Arial, sans-serif;">
      <table align="center" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px; margin:auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 8px 30px rgba(0,0,0,0.08);">
        
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(90deg,#1a1a1a,#000000); color:#ffffff; padding:40px 30px; text-align:center;">
            <h2 style="margin:0; font-size:26px;">Password Reset Request</h2>
            <p style="margin-top:10px; font-size:14px; color:#ccc;">A stylish wardrobe is forever. Passwords, not so much.</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px 30px;">
            <p style="font-size:16px; color:#333; margin-bottom:20px;">
              Hello, we received a request to reset your password associated with your account at <strong>${
                process.env.COMPANY_NAME
              }</strong>.
            </p>
            <p style="font-size:16px; color:#333; margin-bottom:30px;">
              If you made this request, click the button below to reset your password:
            </p>

            <div style="text-align:center; margin: 40px 0;">
              <a href="${resetUrl}" style="background-color:#dc3545; color:white; padding:14px 36px; font-size:16px; border-radius:8px; text-decoration:none; font-weight:bold; box-shadow:0 4px 14px rgba(220,53,69,0.3); display:inline-block;">
                🔐 Reset My Password
              </a>
            </div>

            <p style="font-size:14px; color:#666; margin-bottom:10px;">Or copy and paste this link into your browser:</p>
            <p style="font-size:13px; color:#888; background:#f1f1f1; padding:10px; border-radius:6px; word-break:break-word;">
              ${resetUrl}
            </p>

            <p style="font-size:13px; color:#999; margin-top:30px;">
              This link is valid for <strong>10 minutes</strong>. If you didn’t request a password reset, you can safely ignore this email.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#fafafa; text-align:center; padding:20px; font-size:12px; color:#aaa;">
            &copy; ${new Date().getFullYear()} ${
        process.env.COMPANY_NAME
      }. All rights reserved.<br/>
            Your privacy. Your style. Your security.
          </td>
        </tr>

      </table>
    </div>
  `,
    };

    sendMail(emailOptions);

    res.status(200).json({
      success: true,
      status: "Password reset requested",
      message: "If the email exists, a reset link has been sent",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: "Password reset failed",
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
        status: "Password reset failed",
        message: "Invalid reset token",
      });
    }

    if (!auth.isPasswordResetTokenValid()) {
      return res.status(400).json({
        success: false,
        status: "Password reset failed",
        message: "Reset token has expired",
      });
    }

    auth.password = newPassword;
    auth.clearPasswordResetToken();
    await auth.save();

    res.status(200).json({
      success: true,
      status: "Password reset successful",
      message: "Password reset successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: "Password reset failed",
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
        status: "User not found",
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      status: "User retrieved successfully",
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
      status: "User retrieval failed",
      message: error.message,
    });
  }
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
        status: "User not found",
        message: "User not found",
      });
    }

    auth.isSuspended = true;
    auth.suspendedAt = new Date();
    auth.suspensionReason = reason || "Account suspended by administrator";
    await auth.save();

    res.status(200).json({
      success: true,
      status: "Account suspended successfully",
      message: "Account suspended successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: "Account suspension failed",
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
        status: "User not found",
        message: "User not found",
      });
    }

    auth.isSuspended = false;
    auth.suspendedAt = null;
    auth.suspensionReason = null;
    await auth.save();

    res.status(200).json({
      success: true,
      status: "Account reactivated successfully",
      message: "Account reactivated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: "Account reactivation failed",
      message: error.message,
    });
  }
};
