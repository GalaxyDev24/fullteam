// get config
var config = require('config');

var knex = require('knex')(config.database);

module.exports = knex;
