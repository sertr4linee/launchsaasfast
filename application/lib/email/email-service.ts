import { getResendClient } from './resend-client';
import { getConfig } from '../../config';
import { SecurityEvent, SecurityEventType } from '../../types/security';
import { User } from '@supabase/supabase-js';
import { NewDeviceVerificationEmail } from './templates/new-device-verification.tsx';
import { TwoFactorSetupEmail } from './templates/two-factor-setup.tsx';
import { PasswordResetEmail } from './templates/password-reset.tsx';

const config = getConfig();

export class EmailService {
  private client = getResendClient();

  async sendSecurityNotification(
    type: SecurityEventType,
    user: User,
    context: Record<string, any>
  ) {
    let subject = '';
    let template: React.ReactElement | null = null;

    switch (type) {
      case SecurityEventType.DEVICE_NEW:
        subject = 'New Device Sign-in';
        template = NewDeviceVerificationEmail({ 
          user, 
          verificationUrl: context.verificationUrl 
        });
        break;
      case SecurityEventType.MFA_ENABLED:
        subject = 'Two-Factor Authentication Enabled';
        template = TwoFactorSetupEmail({ user });
        break;
      case SecurityEventType.PASSWORD_RESET_REQUESTED:
        subject = 'Password Reset Request';
        template = PasswordResetEmail({
          user,
          resetUrl: context.resetUrl,
        });
        break;
      // Add more cases for other security notifications
    }

    if (subject && template) {
      if (!user.email) {
        console.error('User email is not available, cannot send email.');
        return;
      }
      await this.sendEmail(user.email, subject, template);
    }
  }

  private async sendEmail(to: string, subject: string, body: React.ReactElement) {
    try {
      await this.client.emails.send({
        from: config.resend.from,
        to,
        subject,
        react: body,
      });
    } catch (error) {
      console.error('Error sending email:', error);
      // Implement more robust error handling and retry logic
    }
  }
}

let emailService: EmailService;

export function getEmailService(): EmailService {
  if (!emailService) {
    emailService = new EmailService();
  }
  return emailService;
}
