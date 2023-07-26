var path = require('path');
process.env.NODE_ENV = 'test';

require('app-module-path').addPath(path.dirname(__dirname));
