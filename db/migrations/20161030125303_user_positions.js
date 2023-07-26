
exports.up = function(knex, Promise) {
  return knex.schema.createTableIfNotExists('user_positions', function(table){
    table.bigincrements('user_id');
    table.integer('position');
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTableIfExists('user_positions');
};
