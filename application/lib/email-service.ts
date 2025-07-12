import nodemailer from 'nodemailer';
import { VERIFICATION_EMAIL_CONFIG } from './email-templates';

let transporter: nodemailer.Transporter | null = null;

// Créer le transporteur email
export function createEmailTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'Gmail', // Utilisation de Gmail comme service SMTP
      host: VERIFICATION_EMAIL_CONFIG.SMTP_HOST,
      port: VERIFICATION_EMAIL_CONFIG.SMTP_PORT,
      secure: VERIFICATION_EMAIL_CONFIG.SMTP_SECURE,
      auth: {
        user: VERIFICATION_EMAIL_CONFIG.SMTP_USER,
        pass: VERIFICATION_EMAIL_CONFIG.SMTP_PASS,
      },
    });
  }
  return transporter;
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Envoyer un email
export async function sendEmail(options: EmailOptions): Promise<void> {
  const transporter = createEmailTransporter();

  const mailOptions = {
    from: VERIFICATION_EMAIL_CONFIG.FROM_EMAIL,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text || options.html.replace(/<[^>]*>/g, ''), // Fallback text
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email envoyé avec succès à: ${options.to}`);
  } catch (error) {
    console.error('Erreur envoi email:', error);
    throw new Error('Échec de l\'envoi de l\'email');
  }
}

// Fonction utilitaire pour envoyer un code de vérification
export async function sendVerificationCode(
  email: string,
  code: string,
  deviceInfo: { browser?: string; os?: string; location?: string }
): Promise<void> {
  const { EMAIL_TEMPLATES } = await import('./email-templates');
  
  const emailOptions: EmailOptions = {
    to: email,
    subject: EMAIL_TEMPLATES.DEVICE_VERIFICATION.subject,
    html: EMAIL_TEMPLATES.DEVICE_VERIFICATION.template(code, deviceInfo),
  };

  await sendEmail(emailOptions);
}
