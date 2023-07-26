
exports.up = function(knex, Promise) {
  
    return knex.schema.createTableIfNotExists('posts', function(table) {
        table.bigIncrements('id').notNullable().primary();
        table.bigInteger('user_id');
        table.text('post_title');
        table.text('post_content', 'longtext');
        table.string('post_status', 32).defaultTo('publish');
        table.string('comment_status', 32).defaultTo('open');
        table.bigInteger('post_parent_id');
        table.string('post_parent_type', 32);
        table.string('post_type', 32).defaultTo('status');
        table.timestamps();
    });
};

exports.down = function(knex, Promise) {
  
    knex.schema.table('posts', function(table) {
        table.dropPrimary();
    });

    return knex.schema.dropTableIfExists('posts');
};
