var path = require('path');
require('app-module-path').addPath(path.dirname(path.dirname(__dirname)));

// game_type is equal to "Competitive" or "Training" or "Friendly" or "Kickabout"
exports.up = function(knex, Promise) {
    return knex.schema.raw('ALTER TABLE games CHANGE game_type game_type VARCHAR(50);');
};

exports.down = function(knex, Promise) {
	return knex.schema.raw('ALTER TABLE games CHANGE game_type game_type INTEGER DEFAULT 0;');
};