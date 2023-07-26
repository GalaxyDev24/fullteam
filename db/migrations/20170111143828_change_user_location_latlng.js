var path = require('path');
require('app-module-path').addPath(path.dirname(path.dirname(__dirname)));
var config = require('config');

exports.up = function(knex, Promise) {
    return knex.schema.raw('ALTER TABLE user_location CHANGE lat lat DECIMAL(16, 10) NOT NULL, CHANGE lon lon DECIMAL(16, 10) NOT NULL;');
};

exports.down = function(knex, Promise) {
	return knex.schema.raw('ALTER TABLE user_location CHANGE lat lat DECIMAL(8, 2) NOT NULL, CHANGE lon lon DECIMAL(8, 2) NOT NULL;');
};