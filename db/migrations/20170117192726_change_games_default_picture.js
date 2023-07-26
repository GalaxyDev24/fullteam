var path = require('path');
require('app-module-path').addPath(path.dirname(path.dirname(__dirname)));
var config = require('config');

exports.up = function(knex, Promise) {
    return knex.schema.raw('ALTER TABLE games CHANGE picture picture VARCHAR(255) CHARSET utf8 COLLATE utf8_general_ci DEFAULT \'' + config.baseUrl + 'UserUploads/TeamPictures/team-placeholder.png\'  NULL;');
};

exports.down = function(knex, Promise) {
  return knex.schema.raw('ALTER TABLE games CHANGE picture picture VARCHAR(255) CHARSET utf8 COLLATE utf8_general_ci DEFAULT \'' + config.baseUrl + 'UserUploads/TeamPictures/team-placeholder.png\'  NULL;');
};