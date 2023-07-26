var bunyan = require('bunyan');

let logger = bunyan.createLogger({
  name: 'fullteamserver',
});

module.exports = logger;
