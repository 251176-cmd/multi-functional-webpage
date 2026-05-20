import nodemailer from 'nodemailer';
import { SentMessageInfo } from 'nodemailer';

/**
 * Interface for email options
 */
export interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  from?: string;
}

/**
 * SMTP Configuration from environment variables
 */
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.example.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER || 'user@example.com';
const SMTP_PASS = process.env.SMTP_PASS || 'password';
const SMTP_FROM = process.env.SMTP_FROM || '"VC4S Starter Template" <noreply@example.com>';

/**
 * Create a transporter object using the default SMTP transport
 */
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465, // true for 465, false for other ports
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

/**
 * Generic function to send an email via SMTP.
 * 
 * @param {EmailOptions} options - The email details (to, subject, body)
 * @returns {Promise<SentMessageInfo>} Result of the send operation
 */
export async function sendEmail(options: EmailOptions): Promise<SentMessageInfo> {
  const { to, subject, text, html, from } = options;

  try {
    const mailOptions = {
      from: from || SMTP_FROM,
      to,
      subject,
      text,
      html,
    };

    console.log(`[Email] Sending email to: ${Array.isArray(to) ? to.join(', ') : to} with subject: "${subject}"`);

    const info = await transporter.sendMail(mailOptions);

    console.log(`[Email] Message sent successfully: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('[Email] Error sending email:', error);
    throw new Error('Failed to send email via SMTP');
  }
}

/**
 * Verifies the SMTP connection.
 * Useful for health checks or startup verification.
 * 
 * @returns {Promise<boolean>} True if connection is valid
 */
export async function verifySmtpConnection(): Promise<boolean> {
  try {
    await transporter.verify();
    console.log('[Email] SMTP connection verified successfully');
    return true;
  } catch (error) {
    console.error('[Email] SMTP verification failed:', error);
    return false;
  }
}

