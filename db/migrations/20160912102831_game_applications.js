
exports.up = function(knex, Promise) {
    var callback = function(table) {
        table.bigIncrements('id').primary();
        table.bigInteger('game_id').notNullable();
        table.bigInteger('user_id').notNullable();
        table.bigInteger('time').notNullable();
    };
    return knex.schema.createTableIfNotExists('game_applications',
                                              callback);
};

exports.down = function(knex, Promise) {
    knex.schema.table('game_applications', function(table) {
        table.dropPrimary();
    });
    return knex.schema.dropTableIfExists('game_applications');
};
