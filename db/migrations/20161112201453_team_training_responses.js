
exports.up = function(knex, Promise) {
  return knex.schema.createTableIfNotExists('team_training_responses', function(table){
    table.bigInteger('training_id').notNullable();
    table.bigInteger('user_id').notNullable();
    // 0 = unsure, 1 = available, 2 = unavailable
    table.integer('response').defaultTo(0);
    table.primary(['training_id', 'user_id']);
  });
};

exports.down = function(knex, Promise) {
  knex.schema.table('team_training_responses', function(table) {
    table.dropPrimary();
  });
  return knex.schema.dropTableIfExists('team_training_responses');
};
