
exports.up = function(knex, Promise) {
  return knex.schema.createTableIfNotExists('game_invites', function(table){
    table.bigInteger('game_id', 20).notNullable();
    table.bigInteger('user_id', 20).notNullable();
    table.bigInteger('time').unsigned().notNullable();
    table.primary(['game_id', 'user_id']);
  });
};

exports.down = function(knex, Promise) {
  knex.schema.table('game_invites', function(table) {
    table.dropPrimary();
  });

  return knex.schema.dropTableIfExists('game_invites');  
};

