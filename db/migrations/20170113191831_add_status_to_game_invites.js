var path = require('path');
require('app-module-path').addPath(path.dirname(path.dirname(__dirname)));
var config = require('config');

exports.up = function(knex, Promise) {
    return knex.schema.table('game_invites', function(table) {
      table.string('status');
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.table('game_invites', function(table) {
        table.dropColumn('status');
    });
};

// ALTER TABLE `fullteam-dev`.`game_invites`   
//   ADD COLUMN `status` VARCHAR(32) NULL;
