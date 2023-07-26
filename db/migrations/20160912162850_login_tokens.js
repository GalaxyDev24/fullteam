
exports.up = function(knex, Promise) {
  
    return knex.schema.createTableIfNotExists('login_tokens', function(table){
        table.bigInteger('user_id').notNullable().primary();
        table.string('login_token', 60).notNullable();
    });

};

exports.down = function(knex, Promise) {
  
    knex.schema.table('login_tokens', function(table) {
        table.dropPrimary();
    });

    return knex.schema.dropTableIfExists('login_tokens');
};

/*
CREATE TABLE `login_tokens` (
  `user_id` bigint(30) NOT NULL,
  `login_token` varchar(60) COLLATE utf8_unicode_ci NOT NULL
) ENGINE=MyISAM AUTO_INCREMENT=83 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
*/