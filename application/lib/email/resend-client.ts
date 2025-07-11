import { Resend } from 'resend';
import { getConfig } from '../../config';

let resend: Resend;

export function getResendClient(): Resend {
  if (!resend) {
    const config = getConfig();
    if (!config.resend.apiKey) {
      throw new Error('Resend API key is not configured.');
    }
    resend = new Resend(config.resend.apiKey);
  }
  return resend;
}
