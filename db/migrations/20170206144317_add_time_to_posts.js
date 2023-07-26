var path = require('path');
require('app-module-path').addPath(path.dirname(path.dirname(__dirname)));
var config = require('config');

exports.up = function(knex, Promise) {
    return knex.schema.table('posts', function(table) {
      table.bigInteger('time');
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.table('posts', function(table) {
        table.dropColumn('time');
    });
};
