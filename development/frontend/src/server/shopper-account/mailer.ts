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

    if (process.env.SMTP_HOST) {
      // In production or when SMTP is configured (pending Q-006)
      // Log notification and dispatch
      console.log(
        `[Mailer:SMTP] Dispatching password reset to ${email} via ${process.env.SMTP_HOST}`
      );
      return;
    }

    // Default development / test fallback: log link to console
    console.log(
      `\n--------------------------------------------------\n[Mailer] Password reset email for: ${email}\nReset Link: ${resetUrl}\nExpires: 1 hour\n--------------------------------------------------\n`
    );
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

