
exports.up = function(knex, Promise) {
  return knex.schema.createTableIfNotExists('team_duty_assignments', function(table){
    table.bigInteger('duty_id');
    table.bigInteger('user_id').notNullable();
    table.primary(['duty_id', 'user_id']);
  });
};

exports.down = function(knex, Promise) {
  knex.schema.table('team_duty_assignments', function(table) {
    table.dropPrimary();
  });
  return knex.schema.dropTableIfExists('team_duty_assignments');
};
