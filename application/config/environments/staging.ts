import base from '../default';

export default {
  ...base,
  dbUrl: process.env.STAGING_DATABASE_URL || 'postgres://localhost:5432/launchsaasstaging',
  logLevel: 'info',
};
