
exports.up = function(knex, Promise) {
  
    return knex.schema.createTableIfNotExists('post_meta', function(table) {
        table.bigIncrements('id').notNullable().primary();
        table.bigInteger('post_id');
        table.string('meta_key', 128);
        table.text('meta_value', 'longtext');
        table.timestamps();
    });
};

exports.down = function(knex, Promise) {
  
    knex.schema.table('post_meta', function(table) {
        table.dropPrimary();
    });

    return knex.schema.dropTableIfExists('post_meta');
};
