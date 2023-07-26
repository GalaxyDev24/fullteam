var path = require('path');
require('app-module-path').addPath(path.dirname(path.dirname(__dirname)));
var config = require('config');

exports.up = function(knex, Promise) {
    return knex.schema.table('posts', function(table) {
    	table.boolean('system').defaultTo(false);
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.table('posts', function(table) {
        table.dropColumn('system');
    });
};

/*ALTER TABLE `fullteam-dev`.`posts`   
  ADD COLUMN `system` TINYINT(1) DEFAULT 0  NULL;*/
