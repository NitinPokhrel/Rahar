// routes/auth.routes.js (Final version with rate limiting)
import { Router } from "express";
import {
  registerWithEmail,
  loginWithEmail,
  authenticateWithGoogle,
  refreshToken,
  sendEmailVerification,
  verifyEmail,
  requestPasswordReset,
  resetPassword,
  changePassword,
  getCurrentUser,
  logout,
  suspendAccount,
  reactivateAccount,
} from "../controllers/auth.controller.js";
import { authMiddleware, adminMiddleware } from "../middleware/auth.middleware.js";
import {
  validateRegistration,
  validateLogin,
  validateEmailVerification,
  validatePasswordResetRequest,
  validatePasswordReset,
  validatePasswordChange,
  validateRefreshToken,
  validateAccountSuspension,
} from "../middleware/validation.middleware.js";
import {
  authRateLimit,
  passwordResetRateLimit,
  emailVerificationRateLimit,
  registrationRateLimit,
} from "../middleware/rateLimiting.middleware.js";

const router = Router();

// Public routes with rate limiting
router.post("/register", registrationRateLimit, validateRegistration, registerWithEmail);
router.post("/login", authRateLimit, validateLogin, loginWithEmail);
router.post("/google", authRateLimit, authenticateWithGoogle);
router.post("/refresh-token", validateRefreshToken, refreshToken);
router.post("/verify-email", validateEmailVerification, verifyEmail);
router.post("/forgot-password", passwordResetRateLimit, validatePasswordResetRequest, requestPasswordReset);
router.post("/reset-password", validatePasswordReset, resetPassword);

// Protected routes (require authentication)
router.use(authMiddleware); // Apply auth middleware to all routes below

router.get("/me", getCurrentUser);
router.post("/logout", logout);
router.post("/send-verification", emailVerificationRateLimit, sendEmailVerification);
router.patch("/change-password", validatePasswordChange, changePassword);

// Admin only routes
router.patch("/:authId/suspend", adminMiddleware, validateAccountSuspension, suspendAccount);
router.patch("/:authId/reactivate", adminMiddleware, reactivateAccount);

export default router;