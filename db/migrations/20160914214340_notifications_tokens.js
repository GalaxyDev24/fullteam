
exports.up = function(knex, Promise) {

  return knex.schema.createTableIfNotExists('notification_tokens', function(table){
    table.bigIncrements('id').primary();
    table.bigInteger('user_id').notNullable();
    table.string('type', 8).notNullable();
    table.string('token', 300).notNullable();
  });

};

exports.down = function(knex, Promise) {

  knex.schema.table('notification_tokens', function(table) {
    table.dropPrimary();
  });

  return knex.schema.dropTableIfExists('notification_tokens');
};

/*
CREATE TABLE `notification_tokens` (
  `id` bigint(30) NOT NULL AUTO_INCREMENT,
  `user_id` bigint(30) NOT NULL,
  `type` varchar(8) COLLATE utf8_unicode_ci NOT NULL,
  `token` varchar(300) COLLATE utf8_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
*/
