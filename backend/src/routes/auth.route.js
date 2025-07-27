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
  getActiveSessions,
  logoutDevice,
} from "../controllers/auth.controller.js";
import {
  authMiddleware,
  permissionMiddleware,
} from "../middleware/auth.middleware.js";
import {
  validateRegistration,
  validateLogin,
  validateEmailVerification,
  validatePasswordResetRequest,
  validatePasswordReset,
  validatePasswordChange,
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
router.post("/refresh-token", refreshToken);
router.post("/verify-email", validateEmailVerification, verifyEmail);
router.post("/forgot-password", passwordResetRateLimit, validatePasswordResetRequest, requestPasswordReset);
router.post("/reset-password", validatePasswordReset, resetPassword);

// Apply auth middleware to all routes below
router.use(authMiddleware);

// Auth required routes
router.get("/me", getCurrentUser);
router.post("/logout", logout);
router.post("/send-verification", emailVerificationRateLimit, sendEmailVerification);
router.patch("/change-password", validatePasswordChange, changePassword);
router.get("/sessions", getActiveSessions);
router.post("/logout-device", logoutDevice);

// Apply admin permission middleware to all routes below
router.use(permissionMiddleware("manageUsers"));

// Admin only routes
router.patch("/:authId/suspend", validateAccountSuspension, suspendAccount);
router.patch("/:authId/reactivate", reactivateAccount);

export default router;