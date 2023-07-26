
exports.up = function(knex, Promise) {
    return knex.schema.createTableIfNotExists('user_settings', function(table){
        table.bigInteger('user_id').notNullable().primary();
        table.boolean('comments').notNullable();
        table.boolean('notifications').notNullable();
        table.boolean('searchable').notNullable();
    });
};

exports.down = function(knex, Promise) {
    knex.schema.table('user_settings', function(table) {
        table.dropPrimary();
    });
    return knex.schema.dropTableIfExists('user_settings');
};

/*

  CREATE TABLE IF NOT EXISTS `user_settings` (
  `user_id` bigint(20) NOT NULL,
  `comments` tinyint(1) NOT NULL,
  `notifications` tinyint(1) NOT NULL,
  `searchable` tinyint(1) NOT NULL
  ) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

*/
