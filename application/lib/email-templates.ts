// Email configuration for device verification
export const VERIFICATION_EMAIL_CONFIG = {
  FROM_EMAIL: process.env.SMTP_FROM_EMAIL || 'noreply@launchsaasfast.com',
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '465'),
  SMTP_SECURE: process.env.SMTP_SECURE === 'true',
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
};

export const EMAIL_TEMPLATES = {
  DEVICE_VERIFICATION: {
    subject: 'Code de vérification pour votre nouvel appareil',
    template: (code: string, deviceInfo: { browser?: string; os?: string; location?: string }) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Vérification d'appareil</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; margin: 0; padding: 0; background-color: #f6f6f6; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px; }
            .header { text-align: center; margin-bottom: 40px; }
            .logo { font-size: 24px; font-weight: bold; color: #2563eb; }
            .code-box { background-color: #f8fafc; border: 2px solid #e2e8f0; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0; }
            .code { font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1e293b; font-family: 'Courier New', monospace; }
            .device-info { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; }
            .footer { margin-top: 40px; text-align: center; color: #64748b; font-size: 14px; }
            .warning { color: #dc2626; font-weight: 500; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🚀 LaunchSaasFast</div>
              <h1>Vérification de votre nouvel appareil</h1>
            </div>
            
            <p>Bonjour,</p>
            
            <p>Nous avons détecté une connexion depuis un nouvel appareil. Pour des raisons de sécurité, veuillez vérifier que c'est bien vous en utilisant le code ci-dessous :</p>
            
            <div class="code-box">
              <div style="margin-bottom: 10px; color: #64748b;">Code de vérification</div>
              <div class="code">${code}</div>
              <div style="margin-top: 10px; color: #64748b; font-size: 14px;">Valide pendant 15 minutes</div>
            </div>
            
            <div class="device-info">
              <strong>📱 Informations sur l'appareil :</strong><br>
              Navigateur : ${deviceInfo.browser || 'Inconnu'}<br>
              Système : ${deviceInfo.os || 'Inconnu'}<br>
              ${deviceInfo.location ? `Localisation : ${deviceInfo.location}` : ''}
            </div>
            
            <p class="warning">⚠️ Si vous ne reconnaissez pas cette connexion, ignorez cet e-mail et changez votre mot de passe immédiatement.</p>
            
            <div class="footer">
              <p>Cet e-mail a été envoyé automatiquement, merci de ne pas y répondre.</p>
              <p>© 2024 LaunchSaasFast. Tous droits réservés.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  },
};
