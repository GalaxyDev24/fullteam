

exports.up = function(knex, Promise) {
    var callback = function(table) {
        table.bigInteger('game_id').notNullable();
        table.bigInteger('user_id').notNullable();
        table.bigInteger('time').notNullable();
    };
    return knex.schema.createTableIfNotExists('game_invites',
                                              callback);
};

exports.down = function(knex, Promise) {
    return knex.schema.dropTableIfExists('game_invites');
};
