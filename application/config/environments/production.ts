import base from '../default';

export default {
  ...base,
  dbUrl: process.env.PROD_DATABASE_URL || 'postgres://localhost:5432/launchsaasfast',
  logLevel: 'warn',
};
