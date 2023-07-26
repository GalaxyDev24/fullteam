var path = require('path');
require('app-module-path').addPath(path.dirname(path.dirname(__dirname)));
var config = require('config');

exports.up = function(knex, Promise) {
    return knex.schema.table('notifications', function(table) {
      table.string('notification_type', 64).notNullable();
      table.timestamps();
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.table('notifications', function(table) {
        table.dropColumn('notification_type');
        table.dropTimestamps();
    });
};
