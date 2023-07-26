/*

CREATE TABLE `user` (
  `id` bigint(30) NOT NULL AUTO_INCREMENT,
  `email` varchar(100) COLLATE utf8_unicode_ci NOT NULL,
  `pass` varchar(105) COLLATE utf8_unicode_ci DEFAULT NULL,
  `position` int(11) NOT NULL,
  `last_active` bigint(20) unsigned DEFAULT NULL,
  `online` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

*/

var bookshelf = require('lib/bookshelf');

module.exports = bookshelf.Model.extend({
    tableName: 'user'
});