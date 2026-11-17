import nodemailer from 'nodemailer';

export interface MailerService {
  sendPasswordResetEmail(email: string, resetUrl: string): Promise<void>;
}

export interface SentEmailRecord {
  to: string;
  resetUrl: string;
  sentAt: Date;
}

let lastSentEmail: SentEmailRecord | null = null;

export class ConsoleOrSmtpMailer implements MailerService {
  async sendPasswordResetEmail(email: string, resetUrl: string): Promise<void> {
    lastSentEmail = {
      to: email,
      resetUrl,
      sentAt: new Date(),
    };

    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASSWORD;
    const from = process.env.SMTP_FROM || 'Owtlet <no-reply@owtlet.com>';

    if (host && user && pass) {
      try {
        const transporter = nodemailer.createTransport({
          host,
          port,
          secure: port === 465,
          auth: {
            user,
            pass,
          },
        });

        const subject = 'Reset your Owtlet™ password';
        const html = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #0D221E; background-color: #F8FAF9; border-radius: 8px;">
            <div style="margin-bottom: 24px; text-align: center;">
              <h1 style="font-size: 24px; font-weight: 800; color: #0D221E; margin: 0;">Owtlet™</h1>
              <p style="font-size: 14px; color: #5A756F; margin-top: 4px;">Live Cannabis Shopping & Marketplace</p>
            </div>
            <div style="background-color: #ffffff; padding: 24px; border-radius: 8px; border: 1px solid #E5EBE8;">
              <h2 style="font-size: 18px; font-weight: 700; margin-top: 0; color: #0D221E;">Password Reset Request</h2>
              <p style="font-size: 15px; line-height: 1.5; color: #2D423E;">
                We received a request to reset the password for your Owtlet account (<strong>${email}</strong>).
              </p>
              <div style="text-align: center; margin: 32px 0;">
                <a href="${resetUrl}" style="background-color: #70F1C7; color: #0D221E; padding: 14px 28px; text-decoration: none; border-radius: 9999px; font-weight: 700; font-size: 15px; display: inline-block;">
                  Reset My Password
                </a>
              </div>
              <p style="font-size: 13px; line-height: 1.4; color: #5A756F;">
                This link will expire in <strong>1 hour</strong>. If you did not request this reset, you can safely ignore this email.
              </p>
              <hr style="border: none; border-top: 1px solid #E5EBE8; margin: 24px 0;" />
              <p style="font-size: 12px; color: #8BA19C; word-break: break-all;">
                If the button above does not work, copy and paste this link into your browser:<br/>
                <a href="${resetUrl}" style="color: #0D221E;">${resetUrl}</a>
              </p>
            </div>
            <div style="margin-top: 24px; text-align: center; font-size: 12px; color: #8BA19C;">
              © ${new Date().getFullYear()} Owtlet™. Adult-use 21+ cannabis marketplace.
            </div>
          </div>
        `;

        await transporter.sendMail({
          from,
          to: email,
          subject,
          text: `Reset your Owtlet password by opening this link: ${resetUrl} (Link expires in 1 hour)`,
          html,
        });

        console.log(`[Mailer:SMTP] Successfully sent password reset email to ${email}`);
        return;
      } catch (err) {
        console.error(`[Mailer:SMTP] Failed to send password reset email to ${email}`);
        if (process.env.NODE_ENV === 'production') {
          throw new Error('Unable to send password reset email. Please contact support.');
        }
      }
    }

    // Security: Only log reset link in non-production environments
    if (process.env.NODE_ENV !== 'production') {
      console.log(
        `\n--------------------------------------------------\n[Mailer] Password reset email for: ${email}\nReset Link: ${resetUrl}\nExpires: 1 hour\n--------------------------------------------------\n`
      );
    } else {
      console.warn(`[Mailer] Warning: SMTP is not configured in production. Password reset email was not sent for ${email}.`);
    }
  }
}

export const defaultMailer: MailerService = new ConsoleOrSmtpMailer();

/**
 * Test helper to inspect the last sent email without sending real mail.
 */
export function getLastSentEmail(): SentEmailRecord | null {
  return lastSentEmail;
}

export function clearLastSentEmail(): void {
  lastSentEmail = null;
}
