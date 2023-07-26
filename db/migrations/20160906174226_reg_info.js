
exports.up = function(knex, Promise) {
    return knex.schema.createTableIfNotExists('reg_info', function(table){
        table.bigIncrements('user_id').notNullable().primary();
        table.string('name').defaultTo("Unspecified");
        table.string('last_name').defaultTo("Unspecified");
        table.string('picture').notNullable();
        table.string('cover_picture').notNullable();
        table.string('birthday').defaultTo("Unspecified");
    });
};

exports.down = function(knex, Promise) {
    knex.schema.table('reg_info', function(table) {
        table.dropPrimary();
    });
    return knex.schema.dropTableIfExists('reg_info');
};


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
