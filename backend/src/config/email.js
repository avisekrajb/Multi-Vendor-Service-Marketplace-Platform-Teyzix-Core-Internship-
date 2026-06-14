import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create transporter with proper configuration
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Verify connection
transporter.verify((error, success) => {
  if (error) {
    console.error('Email server error:', error);
  } else {
    console.log('Email server is ready to send messages');
  }
});

export const sendEmail = async (to, subject, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"TEYZIX" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log('Email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Email error:', error);
    return false;
  }
};

export const sendWelcomeEmail = async (email, name) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">⚡ TEYZIX</h1>
        <p style="color: #e0e7ff; margin-top: 5px;">Nepal's #1 Service Marketplace</p>
      </div>
      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #1f2937;">Welcome, ${name}! 🎉</h2>
        <p style="color: #4b5563;">Thank you for joining TEYZIX. We're excited to have you on board!</p>
        <p style="color: #4b5563;">You can now:</p>
        <ul style="color: #4b5563;">
          <li>Browse and hire expert services</li>
          <li>Post your own services and earn money</li>
          <li>Track projects in real-time</li>
          <li>Chat with clients/providers securely</li>
        </ul>
        <a href="${process.env.FRONTEND_URL}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 20px;">Go to Dashboard</a>
        <p style="color: #6b7280; margin-top: 30px;">Best regards,<br/>The TEYZIX Team</p>
      </div>
    </div>
  `;
  return sendEmail(email, 'Welcome to TEYZIX!', html);
};

export const sendOtpEmail = async (email, otp) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">🔐 Password Reset</h1>
      </div>
      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #1f2937;">OTP Verification</h2>
        <p style="color: #4b5563;">Your OTP for password reset is:</p>
        <div style="font-size: 36px; font-weight: bold; color: #6366f1; padding: 20px; text-align: center; background: #eef2ff; border-radius: 10px; letter-spacing: 5px;">${otp}</div>
        <p style="color: #4b5563; margin-top: 20px;">This OTP is valid for 10 minutes.</p>
        <p style="color: #6b7280; font-size: 12px;">If you didn't request this, please ignore this email.</p>
      </div>
    </div>
  `;
  return sendEmail(email, 'Password Reset OTP', html);
};

export const sendServiceApprovalEmail = async (email, name, serviceTitle) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">✅ Service Approved!</h1>
      </div>
      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #1f2937;">Congratulations, ${name}! 🎉</h2>
        <p style="color: #4b5563;">Your service <strong>"${serviceTitle}"</strong> has been approved and is now live on TEYZIX.</p>
        <p style="color: #4b5563;">Customers can now discover and hire you for this service.</p>
        <a href="${process.env.FRONTEND_URL}/provider/services" style="display: inline-block; background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 20px;">View Your Service</a>
        <p style="color: #6b7280; margin-top: 30px;">Keep up the great work!</p>
      </div>
    </div>
  `;
  return sendEmail(email, 'Your Service Has Been Approved!', html);
};

export const sendStatusChangeEmail = async (email, name, projectTitle, oldStatus, newStatus) => {
  const statusColors = {
    'Pending': '#f59e0b',
    'Accepted': '#3b82f6',
    'In Progress': '#8b5cf6',
    'Completed': '#10b981',
    'Delivered': '#06b6d4'
  };
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">📋 Project Status Update</h1>
      </div>
      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="color: #4b5563;">Dear ${name},</p>
        <p style="color: #4b5563;">Your project <strong>"${projectTitle}"</strong> status has been updated:</p>
        <div style="text-align: center; margin: 20px 0;">
          <span style="display: inline-block; background: ${statusColors[oldStatus]}20; color: ${statusColors[oldStatus]}; padding: 4px 12px; border-radius: 20px; font-weight: bold;">${oldStatus}</span>
          <span style="margin: 0 10px;">→</span>
          <span style="display: inline-block; background: ${statusColors[newStatus]}20; color: ${statusColors[newStatus]}; padding: 4px 12px; border-radius: 20px; font-weight: bold;">${newStatus}</span>
        </div>
        <a href="${process.env.FRONTEND_URL}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 20px;">View Project Details</a>
        <p style="color: #6b7280; margin-top: 30px;">Thank you for using TEYZIX!</p>
      </div>
    </div>
  `;
  return sendEmail(email, `Project Status Update: ${projectTitle}`, html);
};

export const sendReviewThankYouEmail = async (email, name, projectTitle) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">⭐ Thank You for Your Review!</h1>
      </div>
      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #1f2937;">Thank You, ${name}! 🙏</h2>
        <p style="color: #4b5563;">Thank you for taking the time to review the project <strong>"${projectTitle}"</strong>.</p>
        <p style="color: #4b5563;">Your feedback helps our community grow and helps providers improve their services.</p>
        <p style="color: #6b7280; margin-top: 20px;">Continue exploring more services on TEYZIX!</p>
      </div>
    </div>
  `;
  return sendEmail(email, 'Thank You for Your Review!', html);
};

export const sendReviewReceivedEmail = async (email, name, reviewerName, rating, comment, projectTitle) => {
  const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">⭐ New Review Received!</h1>
      </div>
      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="color: #4b5563;">Dear ${name},</p>
        <p style="color: #4b5563;"><strong>${reviewerName}</strong> left a review for your project <strong>"${projectTitle}"</strong>:</p>
        <div style="background: #eef2ff; padding: 20px; border-radius: 10px; margin: 20px 0; text-align: center;">
          <div style="font-size: 24px; color: #f59e0b; letter-spacing: 2px;">${stars}</div>
          <p style="color: #4b5563; margin-top: 10px;">"${comment}"</p>
        </div>
        <a href="${process.env.FRONTEND_URL}/provider/reviews" style="display: inline-block; background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">View All Reviews</a>
        <p style="color: #6b7280; margin-top: 30px;">Keep providing excellent service!</p>
      </div>
    </div>
  `;
  return sendEmail(email, 'New Review Received!', html);
};