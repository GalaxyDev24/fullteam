var path = require('path');
require('app-module-path').addPath(path.dirname(path.dirname(__dirname)));
var config = require('config');

exports.up = function(knex, Promise) {
    return knex.schema.table('notifications', function(table) {
      table.boolean('processed').defaultTo(false);
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.table('notifications', function(table) {
        table.dropColumn('processed');
    });
};