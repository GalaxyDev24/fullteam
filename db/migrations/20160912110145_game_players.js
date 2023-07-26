
exports.up = function(knex, Promise) {
  var callback = function(table) {
    table.bigInteger('game_id').notNullable();
    table.bigInteger('user_id').notNullable();
    table.integer('position').notNullable();
    //table.primary('game_id', 'user_id');
  };
  return knex.schema.createTableIfNotExists('game_players',
                                            callback);
};

exports.down = function(knex, Promise) {
  knex.schema.table('game_players', function(table) {
    //table.dropPrimary();
  });
  return knex.schema.dropTableIfExists('game_players');
};
