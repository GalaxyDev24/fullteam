
exports.up = function(knex, Promise) {
  
    return knex.schema.createTableIfNotExists('comment_likes', function(table) {
        table.bigIncrements('id').notNullable().primary();
        table.bigInteger('comment_id');
        table.bigInteger('user_id');
        table.string('like_type', 20).defaultTo('like');
        table.timestamps();
    });
};

exports.down = function(knex, Promise) {
  
    knex.schema.table('comment_likes', function(table) {
        table.dropPrimary();
    });

    return knex.schema.dropTableIfExists('comment_likes');
};
