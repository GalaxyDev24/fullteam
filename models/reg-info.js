/*

CREATE TABLE IF NOT EXISTS `reg_info` (
  `user_id` bigint(20) NOT NULL,
  `name` varchar(100) COLLATE utf8_unicode_ci DEFAULT "Unspecified",
  `last_name` varchar(100) COLLATE utf8_unicode_ci DEFAULT "Unspecified",
  `picture` varchar(256) COLLATE utf8_unicode_ci NOT NULL,
  `cover_picture` varchar(256) COLLATE utf8_unicode_ci DEFAULT "",
  `birthday` varchar(30) COLLATE utf8_unicode_ci DEFAULT "Unspecified"
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

*/


var bookshelf = require('lib/bookshelf');

module.exports = bookshelf.Model.extend({
    tableName: 'reg_info',
    idAttribute: 'user_id'
});
