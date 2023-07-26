/*

CREATE TABLE IF NOT EXISTS `user_settings` (
  `user_id` bigint(20) NOT NULL,
  `comments` tinyint(1) NOT NULL,
  `notifications` tinyint(1) NOT NULL,
  `searchable` tinyint(1) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

*/

var bookshelf = require('lib/bookshelf');

module.exports = bookshelf.Model.extend({
    tableName: 'user_settings',
    idAttribute: 'user_id'
});
