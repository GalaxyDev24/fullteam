exports.up = function(knex, Promise) {
    return knex.schema.createTableIfNotExists('user_location', function(table){
        table.bigInteger('user_id').notNullable().primary();
        table.decimal('lat').notNullable();
        table.decimal('lon').notNullable();
        table.string('locality').notNullable();
        table.string('country').notNullable();
    });
};

exports.down = function(knex, Promise) {
    knex.schema.table('user_location', function(table) {
        table.dropPrimary();
    });
    return knex.schema.dropTableIfExists('user_location');
};

/*

  CREATE TABLE IF NOT EXISTS `user_location` (
  `user_id` bigint(20) NOT NULL,
  `lat` double NOT NULL,
  `lon` double NOT NULL,
  `locality` varchar(60) COLLATE utf8_unicode_ci DEFAULT "Not Given",
  `country` varchar(30) COLLATE utf8_unicode_ci DEFAULT "Not Given"
  ) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

*/
