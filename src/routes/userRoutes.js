const express = require("express");
const { register, login, logout, updateProfile, changePassword, getAllUsers, getAvailableUsersForBoard, forgotPassword, resetPassword, verifyEmail, resendVerification } = require("../controllers/userController");
const auth = require("../middlewares/authMiddleware");
const { googleLogin } = require("../controllers/userController");
const User = require("../models/User");
const router = express.Router();

router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user)
      return res.status(404).json({ message: "User not found" });

    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    const { sanitizeError } = require("../utils/validators");
    res.status(500).json({ message: sanitizeError(error) });
  }
});

router.post("/register", register);
router.post("/login", login);
router.post("/logout", auth, logout);
router.put("/profile", auth, updateProfile);
router.post("/change-password", auth, changePassword);

router.post("/google-login", googleLogin);

// Forgot & Reset Password
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Email Verification
router.post("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerification);

// Get all users
router.get("/", auth, getAllUsers);

// Get available users for a specific board
router.get("/:boardId/available", auth, getAvailableUsersForBoard);

module.exports = router;
