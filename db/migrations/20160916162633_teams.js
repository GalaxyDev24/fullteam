var path = require('path');
require('app-module-path').addPath(path.dirname(path.dirname(__dirname)));
var config = require('config');

exports.up = function(knex, Promise) {
  return knex.schema.createTableIfNotExists('teams', function(table){
    table.bigIncrements('id', 20).notNullable().primary();
    table.bigInteger('manager_id', 20).notNullable();
    table.string('name', 64).notNullable();
    table.specificType('lat', 'double').defaultTo(-1);
    table.specificType('lon', 'double').defaultTo(-1);
    table.integer('team_size').notNullable();
    table.string('picture').defaultTo(config.baseUrl + 'UserUploads/TeamPictures/team-placeholder.png');
    table.timestamps();
  });  
};

exports.down = function(knex, Promise) {
  knex.schema.table('teams', function(table) {
    table.dropPrimary();
  });
  return knex.schema.dropTableIfExists('teams');  
};

