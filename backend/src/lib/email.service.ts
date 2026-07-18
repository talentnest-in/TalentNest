import nodemailer from 'nodemailer';

// ── SMTP Configuration ───────────────────────────────────────────────────────
const smtpHost = process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const fromEmail = process.env.FROM_EMAIL || 'noreply@talentnest.com';

if (!smtpHost || !smtpUser || !smtpPass) {
  console.warn('SMTP credentials not configured. Email sending will fail.');
  console.warn('Missing:', {
    smtpHost: !!smtpHost,
    smtpUser: !!smtpUser,
    smtpPass: !!smtpPass,
  });
}

// ── Create Transport ──────────────────────────────────────────────────────────
export function createTransport() {
  if (!smtpHost || !smtpUser || !smtpPass) {
    throw new Error('SMTP credentials not configured');
  }

  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: false, // true for 465, false for other ports
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });
}

// ── Email Templates ──────────────────────────────────────────────────────────
function getForgotPasswordTemplate(resetUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password - TalentNest</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff;">
          <!-- Header -->
          <div style="background: #0B1F3A; padding: 30px 20px; text-align: center;">
            <h1 style="color: #fff; margin: 0; font-size: 28px; font-weight: bold;">TalentNest</h1>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px 30px; background: #f9f9f9;">
            <h2 style="color: #0B1F3A; margin-top: 0; font-size: 24px;">Reset Your Password</h2>
            <p style="color: #333; font-size: 16px;">You requested a password reset for your TalentNest account.</p>
            <p style="color: #333; font-size: 16px;">Click the button below to reset your password:</p>
            
            <div style="text-align: center; margin: 35px 0;">
              <a href="${resetUrl}" style="display: inline-block; background: #F26A21; color: #fff; padding: 14px 35px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">Reset Password</a>
            </div>
            
            <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666; font-size: 13px; background: #fff; padding: 10px; border-radius: 3px; border: 1px solid #e0e0e0;">${resetUrl}</p>
            
            <p style="color: #666; font-size: 14px; margin-top: 20px;">This link will expire in 1 hour.</p>
            <p style="color: #666; font-size: 14px;">If you didn't request this password reset, please ignore this email.</p>
          </div>
          
          <!-- Footer -->
          <div style="padding: 20px; text-align: center; background: #0B1F3A; color: #fff; font-size: 12px;">
            <p style="margin: 0;">&copy; ${new Date().getFullYear()} TalentNest. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

function getVerificationTemplate(verificationUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email - TalentNest</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff;">
          <!-- Header -->
          <div style="background: #0B1F3A; padding: 30px 20px; text-align: center;">
            <h1 style="color: #fff; margin: 0; font-size: 28px; font-weight: bold;">TalentNest</h1>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px 30px; background: #f9f9f9;">
            <h2 style="color: #0B1F3A; margin-top: 0; font-size: 24px;">Verify Your Email</h2>
            <p style="color: #333; font-size: 16px;">Thank you for signing up for TalentNest!</p>
            <p style="color: #333; font-size: 16px;">Please verify your email address to complete your registration:</p>
            
            <div style="text-align: center; margin: 35px 0;">
              <a href="${verificationUrl}" style="display: inline-block; background: #F26A21; color: #fff; padding: 14px 35px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">Verify Email</a>
            </div>
            
            <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666; font-size: 13px; background: #fff; padding: 10px; border-radius: 3px; border: 1px solid #e0e0e0;">${verificationUrl}</p>
            
            <p style="color: #666; font-size: 14px; margin-top: 20px;">This link will expire in 24 hours.</p>
            <p style="color: #666; font-size: 14px;">If you didn't create an account, please ignore this email.</p>
          </div>
          
          <!-- Footer -->
          <div style="padding: 20px; text-align: center; background: #0B1F3A; color: #fff; font-size: 12px;">
            <p style="margin: 0;">&copy; ${new Date().getFullYear()} TalentNest. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

import { queueManager, QUEUES } from './queue';

// ── Queue Forgot Password Email ────────────────────────────────────────────────
export async function sendForgotPasswordEmail(email: string, resetUrl: string): Promise<boolean> {
  try {
    await queueManager.addJob(QUEUES.EMAIL, {
      type: 'password_reset',
      to: email,
      data: { resetUrl },
    }, { attempts: 3, backoff: { type: 'exponential', delay: 2000 } });
    return true;
  } catch (error) {
    console.error('Failed to queue password reset email:', error);
    return false;
  }
}

// ── Queue Verification Email ─────────────────────────────────────────────────────
export async function sendVerificationEmail(email: string, verificationUrl: string): Promise<boolean> {
  try {
    await queueManager.addJob(QUEUES.EMAIL, {
      type: 'email_verification',
      to: email,
      data: { verificationUrl },
    }, { attempts: 3, backoff: { type: 'exponential', delay: 2000 } });
    return true;
  } catch (error) {
    console.error('Failed to queue verification email:', error);
    return false;
  }
}

// ── Queue Welcome Email ─────────────────────────────────────────────────────────
export async function sendWelcomeEmail(email: string, name: string): Promise<boolean> {
  try {
    await queueManager.addJob(QUEUES.EMAIL, {
      type: 'welcome',
      to: email,
      data: { name },
    }, { attempts: 3, backoff: { type: 'exponential', delay: 2000 } });
    return true;
  } catch (error) {
    console.error('Failed to queue welcome email:', error);
    return false;
  }
}
