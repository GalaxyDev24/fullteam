
exports.up = function(knex, Promise) {
    return knex.schema.createTableIfNotExists('facebook_ids', function(table){
        table.bigInteger('user_id').notNullable().primary();
        table.bigInteger('facebook_id').notNullable();
    });

};

exports.down = function(knex, Promise) {
    knex.schema.table('facebook_ids', function(table) {
        table.dropPrimary();
    });

    return knex.schema.dropTableIfExists('facebook_ids');
};
