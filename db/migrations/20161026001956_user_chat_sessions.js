
exports.up = function(knex, Promise) {
    return knex.schema.createTableIfNotExists('user_chat_sessions', function(table) {
        table.bigInteger('user_id').notNullable().primary();
        table.string('password', 64);
        table.bigInteger('chat_user_id');
        table.string('token', 128);
        table.timestamps();
    });
};

exports.down = function(knex, Promise) {
    knex.schema.table('user_chat_sessions', function(table) {
        table.dropPrimary();
    });

    return knex.schema.dropTableIfExists('user_chat_sessions');
};
