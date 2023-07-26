var path = require('path');
require('app-module-path').addPath(path.dirname(path.dirname(__dirname)));
var config = require('config');

// This migration totally changed games. Removes many unnecessary params, adds a couple more.

exports.up = function(knex, Promise) {
  return knex.schema.table('games', function(table) {
    table.dropColumn('transport');
    table.dropColumn('application_type');
    table.dropColumn('max_players');
    table.dropColumn('players_joined');
    table.dropColumn('meeting_place');
    table.dropColumn('surface_type');
    table.dropColumn('average_ability');
    table.dropColumn('average_age');
    table.dropColumn('shin_pads');
    table.string('game_title').defaultTo('');
    table.string('opponent').defaultTo('');
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.table('games', function(table) {
    table.boolean('transport').notNullable();
    table.integer('application_type').notNullable();
    table.integer('max_players').notNullable(); 
    table.integer('players_joined').defaultTo(0);
    table.string('meeting_place', 512).notNullable();
    table.integer('surface_type').defaultTo(-1);
    table.decimal('average_ability').defaultTo(-1);
    table.integer('average_age').defaultTo(-1);
    table.boolean('shin_pads').defaultTo(0);
    table.dropColumn('game_title');
    table.dropColumn('opponent');
  });

};
