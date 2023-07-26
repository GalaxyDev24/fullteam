
exports.up = function(knex, Promise) {
  return knex.schema.createTableIfNotExists('player_positions', function(table){
    table.bigInteger('user_id');
    table.integer('position_id');
    table.primary(['user_id', 'position_id']);
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTableIfExists('player_positions');
};
