
exports.up = function(knex, Promise) {
    return knex.schema.createTableIfNotExists('user_feedback', function(table){
        table.bigIncrements('id').notNullable().primary();
        table.bigInteger('profile_user_id').notNullable();
        table.bigInteger('from_user_id').notNullable();
        table.decimal('passing').notNullable();
        table.decimal('shooting').notNullable();
        table.decimal('fitness').notNullable();
        table.decimal('reliability').notNullable();
        table.decimal('average').notNullable();
        table.string('feedback').notNullable();
        table.bigInteger('time_sent').notNullable();
        table.unique(['profile_user_id', 'from_user_id']);
    });
};

exports.down = function(knex, Promise) {
    knex.schema.table('user_feedback', function(table) {
        table.dropPrimary();
        table.dropUnique(['profile_user_id', 'from_user_id']);
    });
    return knex.schema.dropTableIfExists('user_feedback');
  
};


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
