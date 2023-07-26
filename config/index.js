module.exports = (function(env) {

  env = env ? env : 'development';

  var baseUrl = process.env.FULLTEAM_BASE_URL ? process.env.FULLTEAM_BASE_URL : 'https://localhost:8443/';
  
  var config = {
    env: env,
    baseUrl: baseUrl,
    facebook: {
      appId: '403899929802018',
      appSecret: '76c9ca29581131505583a5057c20ec05',
      version: 'v2.4'
    },
    quickblox : {
      appId: 52637,
      authKey: 'tNPrqqXOGm3guOY',
      authSecret: 'GHx-8TTnur7xZBL'
    },
    ws : {
      ssl: process.env.FULLTEAM_WS_SSL === 'TRUE',
      port: process.env.FULLTEAM_WS_PORT ? process.env.FULLTEAM_WS_PORT : 8001,
      ssl_key: process.env.FULLTEAM_WS_SSL_KEY ? process.env.FULLTEAM_WS_SSL_KEY : '',
      ssl_cert: process.env.FULLTEAM_WS_SSL_CERT ? process.env.FULLTEAM_WS_SSL_CERT : ''
    },
    https : {
      enabled: process.env.FULLTEAM_HTTPS === 'TRUE',
      port: process.env.FULLTEAM_HTTPS_PORT ? process.env.FULLTEAM_HTTPS_PORT : 8843,
      ssl_key: process.env.FULLTEAM_HTTPS_SSL_KEY ? process.env.FULLTEAM_HTTPS_SSL_KEY : '',
      ssl_cert: process.env.FULLTEAM_HTTPS_SSL_CERT ? process.env.FULLTEAM_HTTPS_SSL_CERT : ''
    }
  };

  var knexconfig = require('knexfile');
  
  switch (env) {
    case 'production':
      config.database = knexconfig.production;
      break;
    case 'staging':
      config.database = knexconfig.staging;
      break;
    case 'development':
      config.database = knexconfig.development;
      break;
    case 'test':
      config.database = knexconfig.test;
      break;
    default:
      console.error('NODE_ENV environment variable not set');
      process.exit(1);
  }

  return config;

})(process.env.NODE_ENV);