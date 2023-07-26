
exports.up = function(knex, Promise) {
  
    return knex.schema.createTableIfNotExists('post_likes', function(table) {
        table.bigIncrements('id').notNullable().primary();
        table.bigInteger('post_id');
        table.bigInteger('user_id');
        table.string('like_type', 20).defaultTo('like');
        table.timestamps();
    });
};

exports.down = function(knex, Promise) {
  
    knex.schema.table('post_likes', function(table) {
        table.dropPrimary();
    });

    return knex.schema.dropTableIfExists('post_likes');
};
