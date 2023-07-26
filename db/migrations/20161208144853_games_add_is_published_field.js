var path = require('path');
require('app-module-path').addPath(path.dirname(path.dirname(__dirname)));
var config = require('config');

exports.up = function(knex, Promise) {
    return knex.schema.table('games', function(table) {
      table.boolean('is_published').defaultTo(false);
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.table('games', function(table) {
        table.dropColumn('is_published');
    });
};