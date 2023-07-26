
exports.up = function(knex, Promise) {
  return knex.schema.createTableIfNotExists('team_duties', function(table){
    table.bigIncrements('id').primary();
    table.bigInteger('team_id').notNullable();
    table.string('duty_name').notNullable();
  });
};

exports.down = function(knex, Promise) {
  knex.schema.table('team_duties', function(table) {
    table.dropPrimary();
  });
  return knex.schema.dropTableIfExists('team_duties');
};
