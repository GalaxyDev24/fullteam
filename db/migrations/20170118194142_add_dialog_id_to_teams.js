var path = require('path');
require('app-module-path').addPath(path.dirname(path.dirname(__dirname)));
var config = require('config');

exports.up = function(knex, Promise) {
    return knex.schema.table('teams', function(table) {
      table.string('chat_dialog_id', 50);
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.table('teams', function(table) {
        table.dropColumn('chat_dialog_id');
    });
};

// ALTER TABLE `fullteam-dev`.`teams`   
//   ADD COLUMN `chat_dialog_id` BIGINT(20) NULL
