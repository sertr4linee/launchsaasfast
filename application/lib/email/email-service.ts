import { getConfig } from '../../config';
import { SecurityEventType } from '../../types/security';
import { User } from '@supabase/supabase-js';

// Import conditionnel de Resend seulement si nécessaire
let Resend: any = null;
let getResendClient: (() => any) | null = null;

// Templates importés conditionnellement
let NewDeviceVerificationEmail: any = null;
let TwoFactorSetupEmail: any = null;

const config = getConfig();

// Vérifier si Resend est configuré
const isResendConfigured = () => {
  return config.resend?.apiKey && config.resend.apiKey.length > 0;
};

// Initialiser Resend seulement si configuré
const initializeResend = async () => {
  if (!isResendConfigured()) {
    return false;
  }
  
  try {
    const resendModule = await import('./resend-client');
    getResendClient = resendModule.getResendClient;
    
    const templateModules = await Promise.all([
      import('./templates/new-device-verification.tsx'),
      import('./templates/two-factor-setup.tsx')
    ]);
    
    NewDeviceVerificationEmail = templateModules[0].NewDeviceVerificationEmail;
    TwoFactorSetupEmail = templateModules[1].TwoFactorSetupEmail;
    
    return true;
  } catch (error) {
    console.warn('Failed to initialize Resend:', error);
    return false;
  }
};

export class EmailService {
  private client: any = null;
  private initialized = false;

  async sendSecurityNotification(
    type: SecurityEventType,
    user: User,
    context: Record<string, any>
  ) {
    // Vérifier si Resend est configuré avant d'essayer d'envoyer
    if (!isResendConfigured()) {
      console.log(`Email notification skipped (Resend not configured): ${type}`);
      return;
    }

    // Initialiser Resend si pas encore fait
    if (!this.initialized) {
      this.initialized = await initializeResend();
      if (this.initialized && getResendClient) {
        this.client = getResendClient();
      }
    }

    if (!this.initialized || !this.client) {
      console.log(`Email notification skipped (Resend initialization failed): ${type}`);
      return;
    }
    let subject = '';
    let template: React.ReactElement | null = null;

    switch (type) {
      case SecurityEventType.DEVICE_NEW:
        subject = 'New Device Sign-in';
        if (NewDeviceVerificationEmail) {
          template = NewDeviceVerificationEmail({ 
            user, 
            verificationUrl: context.verificationUrl 
          });
        }
        break;
      case SecurityEventType.MFA_ENABLED:
        subject = 'Two-Factor Authentication Enabled';
        if (TwoFactorSetupEmail) {
          template = TwoFactorSetupEmail({ user });
        }
        break;
      // PASSWORD_RESET_REQUESTED supprimé - géré nativement par Supabase
      
      // Ajout d'autres notifications personnalisées
      case SecurityEventType.SUSPICIOUS_ACTIVITY:
        subject = 'Suspicious Activity Detected';
        // TODO: Créer template pour activité suspecte
        break;
      case SecurityEventType.PASSWORD_CHANGED:
        subject = 'Password Changed Successfully';
        // TODO: Créer template pour confirmation changement mot de passe
        break;
    }

    if (subject && template) {
      if (!user.email) {
        console.error('User email is not available, cannot send email.');
        return;
      }
      await this.sendEmail(user.email, subject, template);
    } else if (subject && !template) {
      console.log(`Email template not available for: ${type}`);
    }
  }

  private async sendEmail(to: string, subject: string, body: React.ReactElement) {
    if (!this.client) {
      console.error('Resend client not initialized');
      return;
    }

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
