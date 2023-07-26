
exports.up = function(knex, Promise) {
  
    return knex.schema.createTableIfNotExists('comment_meta', function(table) {
        table.bigIncrements('id').notNullable().primary();
        table.bigInteger('comment_id');
        table.string('meta_key', 128);
        table.text('meta_value', 'longtext');
        table.timestamps();
    });
};

exports.down = function(knex, Promise) {
  
    knex.schema.table('comment_meta', function(table) {
        table.dropPrimary();
    });

    return knex.schema.dropTableIfExists('comment_meta');
};
