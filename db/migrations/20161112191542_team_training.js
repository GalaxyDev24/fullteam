
exports.up = function(knex, Promise) {
  return knex.schema.createTableIfNotExists('team_training', function(table){
    table.bigIncrements('id').primary();
    table.bigInteger('team_id').notNullable();
    table.bigInteger('time').notNullable();
    table.string('description').defaultTo("");
    table.decimal('cost', 18, 2).defaultTo(0);
    table.boolean('is_custom_venue').notNullable();
    table.integer('venue').defaultTo(-1);
    table.decimal('lat').notNullable();
    table.decimal('lon').notNullable();
  });
};

exports.down = function(knex, Promise) {
  knex.schema.table('team_training', function(table) {
    table.dropPrimary();
  });
  return knex.schema.dropTableIfExists('team_training');
};
