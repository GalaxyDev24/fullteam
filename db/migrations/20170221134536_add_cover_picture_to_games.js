var path = require('path');
require('app-module-path').addPath(path.dirname(path.dirname(__dirname)));
var config = require('config');

exports.up = function(knex, Promise) {
    return knex.schema.table('games', function(table) {
      table.string('cover_picture').defaultTo('/Assets/images/placeholders/profile-cover-placeholder.png');
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.table('games', function(table) {
        table.dropColumn('cover_picture');
    });
};