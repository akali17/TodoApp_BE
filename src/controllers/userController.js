const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const { validateEmail, validatePassword, validateUsername, sanitizeError } = require("../utils/validators");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const usernameValidation = validateUsername(username);
    if (!usernameValidation.valid) {
      return res.status(400).json({ message: usernameValidation.message });
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({ message: passwordValidation.message });
    }

    // Check if email exists
    const emailExists = await User.findOne({ email });
    if (emailExists)
      return res.status(400).json({ message: "Email already exists" });

    // Check if username exists
    const usernameExists = await User.findOne({ username });
    if (usernameExists)
      return res.status(400).json({ message: "Username already exists" });

    const hashed = await bcrypt.hash(password, 10);

    // Generate verification token
    const crypto = require("crypto");
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const user = await User.create({
      username,
      email,
      password: hashed,
      verificationToken,
      verificationTokenExpires,
      emailVerified: false,
    });

    // Send verification email (non-blocking with timeout)
    const { sendVerificationEmail } = require("../utils/emailService");
    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
    if (process.env.BREVO_API_KEY) {
      // Send email with timeout to prevent hanging
      Promise.race([
        sendVerificationEmail(email, verificationLink, username),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Email timeout')), 5000))
      ])
        .then((ok) => {
          if (ok) console.log("✅ Verification email sent to:", email);
          else console.error("⚠️ Verification email NOT sent (Brevo returned false)", email);
        })
        .catch(err => console.error("❌ Verification email error:", err.message));
    } else {
      console.warn("⚠️ BREVO_API_KEY missing — verification email not attempted");
    }

    res.status(201).json({ 
      message: "Registration successful! Please check your email to verify your account.",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        emailVerified: user.emailVerified,
      }
    });
  } catch (error) {
    res.status(500).json({ message: sanitizeError(error) });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "Invalid credentials" });

    // Check if email is verified
    if (!user.emailVerified) {
      return res.status(403).json({ 
        message: "Please verify your email before logging in",
        code: "EMAIL_NOT_VERIFIED",
        email: user.email
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login success",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    res.status(500).json({ message: sanitizeError(error) });
  }
};

const logout = async (req, res) => {
  try {
    res.json({ message: "Logout successful" });
  } catch (error) {
    res.status(500).json({ message: sanitizeError(error) });
  }
};
const googleLogin = async (req, res) => {
  try {
    const { token } = req.body;

    // 1. Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, picture, sub } = payload;

    // 2. Kiểm tra có user chưa
    let user = await User.findOne({ email });

    // 3. Nếu chưa có → tạo mới
    if (!user) {
      user = await User.create({
        username: name,
        email,
        password: sub, // không dùng, nhưng cần field
        avatar: picture,
        emailVerified: true, // Google already verified the email
      });
    } else if (!user.emailVerified) {
      // If user exists but email not verified, mark as verified (they're using Google)
      user.emailVerified = true;
      await user.save();
    }

    // 4. Tạo JWT cho FE
    const accessToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Google login success",
      token: accessToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch (err) {
    console.error("Google Login Error:", err.message);
    res.status(500).json({ message: sanitizeError(err) });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { username, email, avatar } = req.body;
    const userId = req.user?.id;

    if (!userId)
      return res.status(401).json({ message: "Unauthorized" });

    // Validate input if updating username or email
    if (username) {
      const usernameValidation = validateUsername(username);
      if (!usernameValidation.valid) {
        return res.status(400).json({ message: usernameValidation.message });
      }

      // Check if username already exists (and not the same user)
      const existingUsername = await User.findOne({ username, _id: { $ne: userId } });
      if (existingUsername)
        return res.status(400).json({ message: "Username already exists" });
    }

    if (email) {
      if (!validateEmail(email))
        return res.status(400).json({ message: "Invalid email format" });

      // Check if email already exists (and not the same user)
      const existingEmail = await User.findOne({ email, _id: { $ne: userId } });
      if (existingEmail)
        return res.status(400).json({ message: "Email already exists" });
    }

    // Build update object
    const updateData = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (avatar !== undefined) updateData.avatar = avatar;

    // Update user
    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    );

    if (!user)
      return res.status(404).json({ message: "User not found" });

    res.json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch (err) {
    res.status(500).json({ message: sanitizeError(err) });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user?.id;

    if (!userId)
      return res.status(401).json({ message: "Unauthorized" });

    // Validate input
    if (!currentPassword || !newPassword)
      return res.status(400).json({ message: "Current password and new password are required" });

    if (newPassword.length < 6)
      return res.status(400).json({ message: "New password must be at least 6 characters" });

    if (currentPassword === newPassword)
      return res.status(400).json({ message: "New password must be different from current password" });

    // Find user and verify current password
    const user = await User.findById(userId);
    if (!user)
      return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Current password is incorrect" });

    // Hash new password and update
    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ message: sanitizeError(error) });
  }
};

// Get all users for member selection
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("_id username email avatar");
    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: sanitizeError(error) });
  }
};

// Get users available to add to a board (exclude already members)
const getAvailableUsersForBoard = async (req, res) => {
  try {
    const { boardId } = req.params;
    const Board = require("../models/Board");
    
    const board = await Board.findById(boardId);
    if (!board) return res.status(404).json({ message: "Board not found" });

    // Get all users except those already in board
    const users = await User.find({
      _id: { $nin: board.members }
    }).select("_id username email avatar");

    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: sanitizeError(error) });
  }
};

// Forgot password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const { sendPasswordResetEmail } = require("../utils/emailService");
    const crypto = require("crypto");

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ message: "User not found" });

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpires = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

    user.resetToken = resetToken;
    user.resetTokenExpires = resetTokenExpires;
    await user.save();

    // Send reset email (non-blocking)
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    if (process.env.BREVO_API_KEY) {
      sendPasswordResetEmail(email, resetLink, user.username)
        .then((ok) => {
          if (ok) console.log("✅ Password reset email sent to:", email);
          else console.error("⚠️ Password reset email NOT sent (Brevo returned false)", email);
        })
        .catch(err => console.error("❌ Password reset email error:", err.message));
    } else {
      console.warn("⚠️ BREVO_API_KEY missing — reset email not attempted");
    }

    res.json({ message: "Password reset email sent" });

  } catch (error) {
    console.error("FORGOT PASSWORD ERROR:", error);
    res.status(500).json({ message: sanitizeError(error) });
  }
};

// Reset password
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword)
      return res.status(400).json({ message: "Token and password required" });

    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return res.status(400).json({ message: passwordValidation.message });
    }

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpires: { $gt: new Date() }
    });

    if (!user)
      return res.status(400).json({ message: "Invalid or expired reset token" });

    // Hash new password
    const hashed = await bcrypt.hash(newPassword, 10);

    user.password = hashed;
    user.resetToken = null;
    user.resetTokenExpires = null;
    await user.save();

    res.json({ message: "Password reset successfully" });

  } catch (error) {
    console.error("RESET PASSWORD ERROR:", error);
    res.status(500).json({ message: sanitizeError(error) });
  }
};

// Verify email
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Verification token is required" });
    }

    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired verification token" });
    }

    // Mark email as verified
    user.emailVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpires = null;
    await user.save();

    res.json({ 
      message: "Email verified successfully! You can now log in.",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        emailVerified: user.emailVerified,
      }
    });

  } catch (error) {
    console.error("VERIFY EMAIL ERROR:", error);
    res.status(500).json({ message: sanitizeError(error) });
  }
};

// Resend verification email
const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    const { sendVerificationEmail } = require("../utils/emailService");
    const crypto = require("crypto");

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.emailVerified) {
      return res.status(400).json({ message: "Email is already verified" });
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    user.verificationToken = verificationToken;
    user.verificationTokenExpires = verificationTokenExpires;
    await user.save();

    // Send verification email (non-blocking)
    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
    sendVerificationEmail(email, verificationLink, user.username)
      .then(() => console.log("✅ Verification email sent to:", email))
      .catch(err => console.error("⚠️ Verification email failed:", err.message));

    res.json({ message: "Verification email sent! Please check your inbox." });

  } catch (error) {
    console.error("RESEND VERIFICATION ERROR:", error);
    res.status(500).json({ message: sanitizeError(error) });
  }
};

module.exports = { 
  register, 
  login, 
  logout, 
  googleLogin, 
  updateProfile, 
  changePassword, 
  getAllUsers, 
  getAvailableUsersForBoard, 
  forgotPassword, 
  resetPassword,
  verifyEmail,
  resendVerification
};

