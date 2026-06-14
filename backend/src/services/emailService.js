import { sendEmail } from '../config/email.js';

export const sendWelcomeEmail = async (email, name, role) => {
  const subject = 'Welcome to TEYZIX! 🎉';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .header h1 { color: white; margin: 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 20px; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⚡ TEYZIX</h1>
          <p style="color: #e0e7ff;">Nepal's #1 Service Marketplace</p>
        </div>
        <div class="content">
          <h2>Welcome, ${name}! 👋</h2>
          <p>Thank you for joining TEYZIX. We're excited to have you on board!</p>
          <p>As a ${role}, you can:</p>
          <ul>
            <li>Browse and hire expert services</li>
            <li>Post your own services and earn money</li>
            <li>Track projects in real-time</li>
            <li>Chat with clients/providers securely</li>
          </ul>
          <a href="${process.env.FRONTEND_URL}/dashboard" class="button">Go to Dashboard</a>
          <p style="margin-top: 30px;">Need help? Contact our support team anytime.</p>
          <p>Best regards,<br>The TEYZIX Team</p>
        </div>
        <div class="footer">
          <p>&copy; 2024 TEYZIX. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  return sendEmail(email, subject, html);
};

export const sendStatusUpdateEmail = async (email, name, projectTitle, oldStatus, newStatus) => {
  const subject = `Project Update: ${projectTitle}`;
  const statusColors = {
    'Pending': '#f59e0b',
    'Accepted': '#3b82f6',
    'In Progress': '#8b5cf6',
    'Completed': '#10b981',
    'Delivered': '#06b6d4'
  };
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-weight: bold; margin: 0 4px; }
        .button { display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 10px 20px; text-decoration: none; border-radius: 8px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2 style="color: white;">Project Status Update</h2>
        </div>
        <div class="content">
          <p>Dear ${name},</p>
          <p>Your project <strong>"${projectTitle}"</strong> status has been updated:</p>
          <p style="text-align: center; margin: 20px 0;">
            <span class="status-badge" style="background: ${statusColors[oldStatus]}20; color: ${statusColors[oldStatus]}; border: 1px solid ${statusColors[oldStatus]};">${oldStatus}</span>
            <span style="font-size: 20px;"> → </span>
            <span class="status-badge" style="background: ${statusColors[newStatus]}20; color: ${statusColors[newStatus]}; border: 1px solid ${statusColors[newStatus]};">${newStatus}</span>
          </p>
          <a href="${process.env.FRONTEND_URL}/dashboard" class="button">View Project Details</a>
          <p style="margin-top: 30px;">Thank you for using TEYZIX!</p>
        </div>
      </div>
    </body>
    </html>
  `;
  return sendEmail(email, subject, html);
};

export const sendServiceApprovedEmail = async (email, name, serviceTitle) => {
  const subject = `Your Service Has Been Approved! ✅`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #10b981; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="color: white;">🎉 Congratulations!</h1>
        </div>
        <div class="content">
          <p>Dear ${name},</p>
          <p>Great news! Your service <strong>"${serviceTitle}"</strong> has been approved and is now live on TEYZIX.</p>
          <p>Customers can now discover and hire you for this service.</p>
          <a href="${process.env.FRONTEND_URL}/provider/services" class="button">View Your Service</a>
          <p style="margin-top: 30px;">Keep up the great work!</p>
        </div>
      </div>
    </body>
    </html>
  `;
  return sendEmail(email, subject, html);
};

export const sendReviewReceivedEmail = async (email, name, reviewerName, rating, comment, projectTitle) => {
  const subject = `New Review Received ⭐`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f59e0b; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .review-box { background: white; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #f59e0b; }
        .stars { color: #f59e0b; font-size: 20px; letter-spacing: 2px; }
        .button { display: inline-block; background: #f59e0b; color: white; padding: 10px 20px; text-decoration: none; border-radius: 8px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="color: white;">⭐ New Review!</h1>
        </div>
        <div class="content">
          <p>Dear ${name},</p>
          <p><strong>${reviewerName}</strong> left a review for your project <strong>"${projectTitle}"</strong>:</p>
          <div class="review-box">
            <div class="stars">${'★'.repeat(rating)}${'☆'.repeat(5-rating)}</div>
            <p style="margin-top: 10px;">"${comment}"</p>
          </div>
          <a href="${process.env.FRONTEND_URL}/provider/reviews" class="button">View All Reviews</a>
          <p style="margin-top: 20px;">Keep providing excellent service!</p>
        </div>
      </div>
    </body>
    </html>
  `;
  return sendEmail(email, subject, html);
};