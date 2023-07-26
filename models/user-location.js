/*

CREATE TABLE IF NOT EXISTS `user_location` (
  `user_id` bigint(20) NOT NULL,
  `lat` double NOT NULL,
  `lon` double NOT NULL,
  `locality` varchar(60) COLLATE utf8_unicode_ci DEFAULT "Not Given",
  `country` varchar(30) COLLATE utf8_unicode_ci DEFAULT "Not Given"
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

*/

var bookshelf = require('lib/bookshelf');

module.exports = bookshelf.Model.extend({
    tableName: 'user_location',
    idAttribute: 'user_id'
});
