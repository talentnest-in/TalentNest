import { Job } from 'bullmq';
import { queueManager, QUEUES } from '../lib/queue';
import nodemailer from 'nodemailer';

const smtpHost = process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const fromEmail = process.env.FROM_EMAIL || 'noreply@talentnest.com';

function getForgotPasswordTemplate(resetUrl: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Reset Your Password - TalentNest</title></head><body style="font-family:Arial,sans-serif;line-height:1.6;color:#333;margin:0;padding:0;"><div style="max-width:600px;margin:0 auto;background:#fff;"><div style="background:#0B1F3A;padding:30px 20px;text-align:center;"><h1 style="color:#fff;margin:0;font-size:28px;font-weight:bold;">TalentNest</h1></div><div style="padding:40px 30px;background:#f9f9f9;"><h2 style="color:#0B1F3A;margin-top:0;font-size:24px;">Reset Your Password</h2><p style="color:#333;font-size:16px;">You requested a password reset for your TalentNest account.</p><p style="color:#333;font-size:16px;">Click the button below to reset your password:</p><div style="text-align:center;margin:35px 0;"><a href="${resetUrl}" style="display:inline-block;background:#F26A21;color:#fff;padding:14px 35px;text-decoration:none;border-radius:5px;font-weight:bold;font-size:16px;">Reset Password</a></div><p style="color:#666;font-size:14px;">Or copy and paste this link into your browser:</p><p style="word-break:break-all;color:#666;font-size:13px;background:#fff;padding:10px;border-radius:3px;border:1px solid #e0e0e0;">${resetUrl}</p><p style="color:#666;font-size:14px;margin-top:20px;">This link will expire in 1 hour.</p><p style="color:#666;font-size:14px;">If you didn't request this, please ignore this email.</p></div><div style="padding:20px;text-align:center;background:#0B1F3A;color:#fff;font-size:12px;"><p style="margin:0;">&copy; ${new Date().getFullYear()} TalentNest. All rights reserved.</p></div></div></body></html>`;
}

function getVerificationTemplate(verificationUrl: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Verify Your Email - TalentNest</title></head><body style="font-family:Arial,sans-serif;line-height:1.6;color:#333;margin:0;padding:0;"><div style="max-width:600px;margin:0 auto;background:#fff;"><div style="background:#0B1F3A;padding:30px 20px;text-align:center;"><h1 style="color:#fff;margin:0;font-size:28px;font-weight:bold;">TalentNest</h1></div><div style="padding:40px 30px;background:#f9f9f9;"><h2 style="color:#0B1F3A;margin-top:0;font-size:24px;">Verify Your Email</h2><p style="color:#333;font-size:16px;">Thank you for signing up for TalentNest!</p><p style="color:#333;font-size:16px;">Please verify your email address to complete your registration:</p><div style="text-align:center;margin:35px 0;"><a href="${verificationUrl}" style="display:inline-block;background:#F26A21;color:#fff;padding:14px 35px;text-decoration:none;border-radius:5px;font-weight:bold;font-size:16px;">Verify Email</a></div><p style="color:#666;font-size:14px;">Or copy and paste this link into your browser:</p><p style="word-break:break-all;color:#666;font-size:13px;background:#fff;padding:10px;border-radius:3px;border:1px solid #e0e0e0;">${verificationUrl}</p><p style="color:#666;font-size:14px;margin-top:20px;">This link will expire in 24 hours.</p><p style="color:#666;font-size:14px;">If you didn't create an account, please ignore this email.</p></div><div style="padding:20px;text-align:center;background:#0B1F3A;color:#fff;font-size:12px;"><p style="margin:0;">&copy; ${new Date().getFullYear()} TalentNest. All rights reserved.</p></div></div></body></html>`;
}

function getWelcomeTemplate(name: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Welcome to TalentNest</title></head><body style="font-family:Arial,sans-serif;line-height:1.6;color:#333;margin:0;padding:0;"><div style="max-width:600px;margin:0 auto;background:#fff;"><div style="background:#0B1F3A;padding:30px 20px;text-align:center;"><h1 style="color:#fff;margin:0;font-size:28px;font-weight:bold;">TalentNest</h1></div><div style="padding:40px 30px;background:#f9f9f9;"><h2 style="color:#0B1F3A;margin-top:0;font-size:24px;">Welcome, ${name}!</h2><p style="color:#333;font-size:16px;">Thank you for joining TalentNest. We're excited to have you on board!</p><p style="color:#333;font-size:16px;">Start by completing your profile and exploring opportunities.</p><div style="text-align:center;margin:35px 0;"><a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" style="display:inline-block;background:#F26A21;color:#fff;padding:14px 35px;text-decoration:none;border-radius:5px;font-weight:bold;font-size:16px;">Get Started</a></div></div><div style="padding:20px;text-align:center;background:#0B1F3A;color:#fff;font-size:12px;"><p style="margin:0;">&copy; ${new Date().getFullYear()} TalentNest. All rights reserved.</p></div></div></body></html>`;
}

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!smtpHost || !smtpUser || !smtpPass) {
    throw new Error('SMTP credentials not configured');
  }
  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: false,
    auth: { user: smtpUser, pass: smtpPass },
  });
  await transporter.sendMail({ from: fromEmail, to, subject, html });
}

export async function emailProcessor(job: Job): Promise<void> {
  const { type, to, data } = job.data;

  switch (type) {
    case 'welcome': {
      const html = getWelcomeTemplate(data.name);
      await sendEmail(to, 'Welcome to TalentNest!', html);
      break;
    }
    case 'password_reset': {
      const html = getForgotPasswordTemplate(data.resetUrl);
      await sendEmail(to, 'Reset Your Password - TalentNest', html);
      break;
    }
    case 'email_verification': {
      const html = getVerificationTemplate(data.verificationUrl);
      await sendEmail(to, 'Verify Your Email - TalentNest', html);
      break;
    }
    default:
      console.warn(`[EmailWorker] Unknown email type: ${type}`);
  }
}

export function registerEmailWorker(): void {
  queueManager.defineQueue(QUEUES.EMAIL);
  queueManager.defineWorker(QUEUES.EMAIL, emailProcessor, { concurrency: 3 });
  console.log('[Queue] Email worker registered');
}
