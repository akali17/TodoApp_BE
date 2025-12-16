const nodemailer = require("nodemailer");

// Using Gmail SMTP - you need to enable "Less Secure Apps" or use App Password
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "your-email@gmail.com",
    pass: process.env.EMAIL_PASSWORD || "your-app-password",
  },
});

// Test connection
transporter.verify((error, success) => {
  if (error) {
    // Email service connection error
  }
});

const sendInviteEmail = async (to, boardTitle, inviteLink, senderName) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER || "noreply@todoapp.com",
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
    console.error("❌ Send invite email error:", err);
    return false;
  }
};

const sendPasswordResetEmail = async (to, resetLink, userName) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER || "noreply@todoapp.com",
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
    console.error("❌ Send password reset email error:", err);
    return false;
  }
};

module.exports = {
  sendInviteEmail,
  sendPasswordResetEmail,
};
