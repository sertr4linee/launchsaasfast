import base from '../default';

export default {
  ...base,
  dbUrl: process.env.DEV_DATABASE_URL || 'postgres://localhost:5432/launchsaasdev',
  logLevel: 'debug',
};
