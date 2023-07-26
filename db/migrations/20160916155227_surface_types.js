
exports.up = function(knex, Promise) {
	return knex.schema.createTableIfNotExists('surface_types', function(table){
		table.integer('id').notNullable().primary();
		table.string('name', 30).notNullable();
	});
  
};

exports.down = function(knex, Promise) {
    knex.schema.table('surface_types', function(table) {
        table.dropPrimary();
    });

    return knex.schema.dropTableIfExists('surface_types');  
};
