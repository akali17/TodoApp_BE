const nodemailer = require("nodemailer");

// Using Gmail SMTP - requires App Password (not regular password)
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // Use TLS (not SSL)
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
  connectionTimeout: 5000, // 5 seconds
  greetingTimeout: 3000,
  socketTimeout: 5000,
});

// Test connection
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Email service error:", error.message);
  } else {
    console.log("✅ Email service ready");
  }
});

const sendInviteEmail = async (to, boardTitle, inviteLink, senderName) => {
  try {
    const mailOptions = {
      from: `WWW <${process.env.EMAIL_USER}>`,
      to,
      subject: `You're invited to board "${boardTitle}"`,
      html: `
        <h2>Board Invitation</h2>
        <p>Hi there!</p>
        <p><strong>${senderName}</strong> invited you to join the board <strong>"${boardTitle}"</strong></p>
        <p>Click the link below to accept the invitation:</p>
        <a href="${inviteLink}" style="display: inline-block; padding: 10px 20px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
          Accept Invitation
        </a>
        <p>Or copy this link: <a href="${inviteLink}">${inviteLink}</a></p>
        <p>This link will expire in 7 days.</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (err) {
    console.error("❌ Send invite email error:", err.message);
    return false;
  }
};

const sendPasswordResetEmail = async (to, resetLink, userName) => {
  try {
    const mailOptions = {
      from: `WWW <${process.env.EMAIL_USER}>`,
      to,
      subject: "Password Reset Request",
      html: `
        <h2>Password Reset</h2>
        <p>Hi ${userName},</p>
        <p>We received a request to reset your password. Click the link below to create a new password:</p>
        <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
          Reset Password
        </a>
        <p>Or copy this link: <a href="${resetLink}">${resetLink}</a></p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, you can ignore this email.</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (err) {
    console.error("❌ Send password reset email error:", err.message);
    return false;
  }
};

const sendVerificationEmail = async (to, verificationLink, userName) => {
  try {
    const mailOptions = {
      from: `WWW <${process.env.EMAIL_USER}>`,
      to,
      subject: "Verify Your Email Address",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Welcome to Todo App! 🎉</h2>
          <p>Hi ${userName},</p>
          <p>Thank you for registering! Please verify your email address to activate your account.</p>
          <p>Click the button below to verify your email:</p>
          <a href="${verificationLink}" style="display: inline-block; padding: 12px 30px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold;">
            Verify Email Address
          </a>
          <p>Or copy this link: <a href="${verificationLink}">${verificationLink}</a></p>
          <p style="color: #666;">This link will expire in 24 hours.</p>
          <p style="color: #999; font-size: 12px;">If you didn't create an account, you can safely ignore this email.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (err) {
    console.error("❌ Send verification email error:", err.message);
    return false;
  }
};

module.exports = {
  sendInviteEmail,
  sendPasswordResetEmail,
  sendVerificationEmail,
};
