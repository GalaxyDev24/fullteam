var path = require('path');
require('app-module-path').addPath(path.dirname(path.dirname(__dirname)));
var config = require('config');

exports.up = function(knex, Promise) {
    return knex.schema.table('games', function(table) {
      table.boolean('is_training').defaultTo(false);
      table.integer('game_type').defaultTo(0);
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.table('games', function(table) {
        table.dropColumn('is_training');
        table.dropColumn('game_type');
    });
};