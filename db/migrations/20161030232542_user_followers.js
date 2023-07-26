
exports.up = function(knex, Promise) {
  
    return knex.schema.createTableIfNotExists('user_followers', function(table) {
        table.bigInteger('user_id');
        table.bigInteger('follower_id');
        table.primary(['user_id', 'follower_id']);
    });
};

exports.down = function(knex, Promise) {
  
    knex.schema.table('user_followers', function(table) {
        table.dropPrimary();
    });

    return knex.schema.dropTableIfExists('user_followers');
};
