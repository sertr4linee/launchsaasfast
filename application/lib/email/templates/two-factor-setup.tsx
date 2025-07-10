import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Text,
} from '@react-email/components';
import * as React from 'react';
import { User } from '@supabase/supabase-js';

interface TwoFactorSetupEmailProps {
  user: User;
}

export const TwoFactorSetupEmail = ({ user }: TwoFactorSetupEmailProps) => (
  <Html>
    <Head />
    <Preview>Two-Factor Authentication Enabled</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={paragraph}>Hi {user.email},</Text>
        <Text style={paragraph}>
          This is a confirmation that two-factor authentication has been
          successfully enabled for your account.
        </Text>
        <Text style={paragraph}>
          Thanks,
          <br />
          The LaunchSaaSFast Team
        </Text>
      </Container>
    </Body>
  </Html>
);

const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '26px',
};
