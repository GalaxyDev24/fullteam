var path = require('path');
require('app-module-path').addPath(path.dirname(path.dirname(__dirname)));
var config = require('config');

exports.up = function(knex, Promise) {
    return knex.schema.table('post_likes', function(table) {
      table.timestamp('deleted_at').nullable();
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.table('post_likes', function(table) {
        table.dropColumn('deleted_at');
    });
};