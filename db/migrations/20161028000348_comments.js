
exports.up = function(knex, Promise) {
  
    return knex.schema.createTableIfNotExists('comments', function(table) {
        table.bigIncrements('id').notNullable().primary();
        table.bigInteger('post_id');
        table.bigInteger('parent_id');
        table.bigInteger('user_id');
        table.text('content', 'longtext');
        table.timestamps();
    });
};

exports.down = function(knex, Promise) {
  
    knex.schema.table('comments', function(table) {
        table.dropPrimary();
    });

    return knex.schema.dropTableIfExists('comments');
};
