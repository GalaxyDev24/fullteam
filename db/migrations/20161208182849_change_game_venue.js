var path = require('path');
require('app-module-path').addPath(path.dirname(path.dirname(__dirname)));
var config = require('config');

exports.up = function(knex, Promise) {
    return knex.schema.raw('ALTER TABLE games CHANGE venue venue VARCHAR(60) NULL');
};

exports.down = function(knex, Promise) {
	return knex.schema.raw('ALTER TABLE games CHANGE venue venue VARCHAR(60) NULL');
};