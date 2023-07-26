
exports.up = function(knex, Promise) {
  
    return knex.schema.createTableIfNotExists('reset_password_tokens', function(table) {
        table.bigIncrements('id').notNullable().primary();
        table.string('email', 120);
        table.string('token', 255);
        table.timestamp('expiry_date');
    });
};

exports.down = function(knex, Promise) {
  
    knex.schema.table('reset_password_tokens', function(table) {
        table.dropPrimary();
    });

    return knex.schema.dropTableIfExists('reset_password_tokens');
};
