var path = require('path');
require('app-module-path').addPath(path.dirname(path.dirname(__dirname)));
var config = require('config');

exports.up = function(knex, Promise) {
  return knex.schema.createTableIfNotExists('games', function(table) {
    table.bigIncrements('id').primary().notNullable();
    table.bigInteger('owner_id').notNullable();
    table.boolean('is_custom_venue').notNullable();
    table.integer('venue').defaultTo(-1);
    table.boolean('transport').notNullable();
    table.boolean('public').notNullable();
    table.integer('application_type').notNullable();
    table.boolean('is_team_game').defaultTo(false);
    table.integer('team_id').defaultTo(-1);
    table.bigInteger('game_time').notNullable();
    table.bigInteger('time_created').notNullable();
    // max_players is huge number if limitless (team games), hack but
    // shouldn't be an issue
    table.integer('max_players').notNullable(); 
    table.integer('players_joined').defaultTo(0);
    table.string('meeting_place', 512).notNullable();
    table.text('description').notNullable();
    table.decimal('lat').notNullable();
    table.decimal('lon').notNullable();
    table.integer('surface_type').defaultTo(-1);
    table.decimal('average_ability').defaultTo(-1);
    table.integer('average_age').defaultTo(-1);
    table.decimal('cost', 18, 2).defaultTo(0);
    table.boolean('shin_pads').defaultTo(0);
    table.string('picture').defaultTo(config.baseUrl + 'UserUploads/ProfilePictures/DefaultPicture.jpg');
  });
};

exports.down = function(knex, Promise) {
  knex.schema.table('games', function(table) {
    table.dropPrimary();
  });
  return knex.schema.dropTableIfExists('games');
};
