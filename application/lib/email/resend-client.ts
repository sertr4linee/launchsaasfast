import { Resend } from 'resend';
import { getConfig } from '../../config';

const config = getConfig();

let resend: Resend;

export function getResendClient(): Resend {
  if (!resend) {
    if (!config.resend.apiKey) {
      throw new Error('Resend API key is not configured.');
    }
    resend = new Resend(config.resend.apiKey);
  }
  return resend;
}
