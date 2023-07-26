/*

CREATE TABLE IF NOT EXISTS `user_feedback` (
  `id` bigint(20) NOT NULL,
  `profile_user_id` bigint(20) NOT NULL,
  `from_user_id` bigint(20) NOT NULL,
  `passing` float NOT NULL,
  `shooting` float NOT NULL,
  `fitness` float NOT NULL,
  `reliability` float NOT NULL,
  `average` float NOT NULL,
  `feedback` varchar(250) COLLATE utf8_unicode_ci NOT NULL,
  `time_sent` BIGINT UNSIGNED NOT NULL
) ENGINE=MyISAM AUTO_INCREMENT=70 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

*/

var bookshelf = require('lib/bookshelf');

module.exports = bookshelf.Model.extend({
    tableName: 'user_feedback',
});
