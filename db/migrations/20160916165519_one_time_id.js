
exports.up = function(knex, Promise) {
    return knex.schema.createTableIfNotExists('one_time_id', function(table){
        table.string('id', 60).notNullable().primary();
        table.bigInteger('user_id', 20).notNullable();
    });    
};

exports.down = function(knex, Promise) {
    knex.schema.table('one_time_id', function(table) {
        table.dropPrimary();
    });
    return knex.schema.dropTableIfExists('one_time_id');    
};
