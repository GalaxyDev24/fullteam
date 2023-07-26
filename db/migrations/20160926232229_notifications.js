
exports.up = function(knex, Promise) {
  
    return knex.schema.createTableIfNotExists('notifications', function(table){
        table.bigIncrements('id').notNullable().primary();
        table.bigInteger('user_id').notNullable();
        table.integer('type').notNullable();
        table.bigInteger('time').notNullable();
        table.boolean('seen').defaultTo(false);
        table.text('data').notNullable();
    });

};

exports.down = function(knex, Promise) {
  
    knex.schema.table('notifications', function(table) {
        table.dropPrimary();
    });

    return knex.schema.dropTableIfExists('notifications');
};


/*

CREATE TABLE IF NOT EXISTS `notifications` (
    `id` bigint(30) NOT NULL,
    `user_id` bigint(30) NOT NULL,
    `type` int NOT NULL,
    `time` bigint unsigned NOT NULL,
    `seen` tinyint(1) DEFAULT 0,
    `data` text NOT NULL,
) ENGINE=MyISAM AUTO_INCREMENT=83 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

*/
