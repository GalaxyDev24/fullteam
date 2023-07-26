
exports.up = function(knex, Promise) {
    var callback = function(table) {
        table.bigInteger('team_id').notNullable();
        table.bigInteger('user_id').notNullable();
        table.integer('amount').notNullable();
        table.primary(['team_id', 'user_id']);
    };
    return knex.schema.createTableIfNotExists('team_payments',
                                              callback);
};

exports.down = function(knex, Promise) {
    knex.schema.table('team_payments', function(table) {
        table.dropPrimary();
    });
    return knex.schema.dropTableIfExists('team_payments');
};
