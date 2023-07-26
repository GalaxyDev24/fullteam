var path = require('path');
require('app-module-path').addPath(path.dirname(path.dirname(__dirname)));
var config = require('config');

exports.up = function(knex, Promise) {
    return knex.schema.table('teams', function(table) {
      table.string('formation', 16).notNullable().defaultTo('4-4-2');
      table.string('cover_picture').defaultTo('/Assets/images/placeholders/profile-cover-placeholder.png');
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.table('teams', function(table) {
        table.dropColumn('formation');
        table.dropColumn('cover_picture');
    });
};
