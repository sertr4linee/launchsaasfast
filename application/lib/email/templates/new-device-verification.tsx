import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';
import { User } from '@supabase/supabase-js';

interface NewDeviceVerificationEmailProps {
  user: User;
  verificationUrl: string;
}

export const NewDeviceVerificationEmail = ({
  user,
  verificationUrl,
}: NewDeviceVerificationEmailProps) => (
  <Html>
    <Head />
    <Preview>New Device Sign-in Verification</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={paragraph}>Hi {user.email},</Text>
        <Text style={paragraph}>
          We detected a sign-in from a new device. If this was you, you can
          ignore this email. If you don't recognize this activity, please secure
          your account immediately.
        </Text>
        <Section style={btnContainer}>
          <Button style={button} href={verificationUrl}>
            Verify Device
          </Button>
        </Section>
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

const btnContainer = {
  textAlign: 'center' as const,
};

const button = {
  backgroundColor: '#5F51E8',
  borderRadius: '3px',
  color: '#fff',
  fontSize: '16px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px',
};
