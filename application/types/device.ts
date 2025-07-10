export interface DeviceInfo {
  fingerprint: string;
  userAgent: string;
  browser: string;
  os: string;
  platform: string;
  ipAddress: string;
  timestamp: number;
}

export interface ParsedUserAgent {
  browser: string;
  os: string;
  platform: string;
}
