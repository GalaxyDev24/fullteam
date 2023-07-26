
exports.up = function(knex, Promise) {
  return knex.schema.createTableIfNotExists('blocked_users', function(table){
    table.bigInteger('user_id').notNullable();
    table.bigInteger('other_user_id').notNullable();
    table.unique(['user_id', 'other_user_id']);
  });
};

exports.down = function(knex, Promise) {
  knex.schema.table('user_settings', function(table) {
    table.dropUnique(['user_id', 'other_user_id']);
  });
  return knex.schema.dropTableIfExists('blocked_users');
};
