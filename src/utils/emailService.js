const nodemailer = require("nodemailer");

// Brevo (Sendinblue) SMTP configuration
const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.BREVO_EMAIL,
    pass: process.env.BREVO_SMTP_KEY,
  },
  connectionTimeout: 10000,
  greetingTimeout: 5000,
  socketTimeout: 10000,
});

// Verify connection on startup
if (process.env.BREVO_EMAIL && process.env.BREVO_SMTP_KEY) {
  transporter.verify((error, success) => {
    if (error) {
      console.error("❌ Brevo SMTP error:", error.message);
    } else {
      console.log("✅ Brevo email service ready");
    }
  });
} else {
  console.warn("⚠️ Brevo not configured: missing BREVO_EMAIL or BREVO_SMTP_KEY");
}

const FROM_EMAIL = process.env.EMAIL_FROM || process.env.BREVO_EMAIL || 'noreply@app.com';

const sendInviteEmail = async (to, boardTitle, inviteLink, senderName) => {
  try {
    if (!process.env.BREVO_SMTP_KEY) {
      console.warn('⚠️ Brevo not configured: missing BREVO_SMTP_KEY');
      return false;
    }
    
    console.log('✉️ Sending invite via Brevo to', to);
    
    const info = await transporter.sendMail({
      from: `WWW <${FROM_EMAIL}>`,
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
    });
    
    console.log('✅ Brevo invite sent, messageId:', info.messageId);
    return true;
  } catch (err) {
    console.error("❌ Send invite email error:", err.message);
    return false;
  }
};

const sendPasswordResetEmail = async (to, resetLink, userName) => {
  try {
    if (!process.env.BREVO_SMTP_KEY) {
      console.warn('⚠️ Brevo not configured: missing BREVO_SMTP_KEY');
      return false;
    }
    
    console.log('✉️ Sending password reset via Brevo to', to);
    
    const info = await transporter.sendMail({
      from: `WWW <${FROM_EMAIL}>`,
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
    });
    
    console.log('✅ Brevo reset sent, messageId:', info.messageId);
    return true;
  } catch (err) {
    console.error("❌ Send password reset email error:", err.message);
    return false;
  }
};

const sendVerificationEmail = async (to, verificationLink, userName) => {
  try {
    if (!process.env.BREVO_SMTP_KEY) {
      console.warn('⚠️ Brevo not configured: missing BREVO_SMTP_KEY');
      return false;
    }
    
    console.log('✉️ Sending verification via Brevo to', to);
    
    const info = await transporter.sendMail({
      from: `WWW <${FROM_EMAIL}>`,
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
    });
    
    console.log('✅ Brevo verification sent, messageId:', info.messageId);
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
