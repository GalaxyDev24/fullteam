
exports.up = function(knex, Promise) {
  
    return knex.schema.createTableIfNotExists('team_followers', function(table) {
        table.bigInteger('team_id');
        table.bigInteger('follower_id');
        table.primary(['team_id', 'follower_id']);
    });
};

exports.down = function(knex, Promise) {
  
    knex.schema.table('team_followers', function(table) {
        table.dropPrimary();
    });

    return knex.schema.dropTableIfExists('team_followers');
};
