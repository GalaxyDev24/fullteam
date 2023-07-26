
exports.up = function(knex, Promise) {
  return knex.schema.createTableIfNotExists('user', function(table){
    table.bigIncrements('id').primary();
    table.string('email', 254).notNullable().unique();
    table.string('pass', 105);
    table.bigInteger('last_active').unsigned();
    table.boolean('online').defaultTo(0);
    table.integer('gender'); // ISO/IEC_5218, 0 = unknown, 1 = male, 2 = female, 9 = n/a
    table.integer('age');
    table.string('mobile_number', 11);
  });
};

exports.down = function(knex, Promise) {
  knex.schema.table('user', function(table) {
    table.dropPrimary();
    table.dropUnique(['email']);
  });
  return knex.schema.dropTableIfExists('user');
};

/*

  CREATE TABLE IF NOT EXISTS `user` (
  `id` bigint(30) NOT NULL,
  `email` varchar(100) COLLATE utf8_unicode_ci NOT NULL,
  `pass` varchar(105),
  `position` integer NOT NULL,
  `last_active` BIGINT UNSIGNED, 
  `online` tinyint(1)
  ) ENGINE=MyISAM AUTO_INCREMENT=83 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;


*/
