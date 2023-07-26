exports.up = function(knex, Promise) {
    return knex.schema.createTableIfNotExists('user_location_history', function(table){
    	table.bigIncrements('id', 20).notNullable().primary();
        table.bigInteger('user_id').notNullable();
        table.decimal('lat', 16, 10).notNullable();
        table.decimal('lon', 16, 10).notNullable();
        table.string('locality').notNullable();
        table.string('country').notNullable();
        table.timestamps();
    });
};

exports.down = function(knex, Promise) {
    knex.schema.table('user_location_history', function(table) {
        table.dropPrimary();
    });
    return knex.schema.dropTableIfExists('user_location_history');
};