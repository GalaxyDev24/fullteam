
exports.up = function(knex, Promise) {
  return knex.schema.createTableIfNotExists('article',
    function(table) {
      table.bigIncrements('id').primary();
      table.bigInteger('vendor_id');
      table.bigInteger('time_posted');
      table.string('title');
      table.string('picture');
      table.text('article_body');
    });
};

exports.down = function(knex, Promise) {
  knex.schema.table('article', function(table) {
    table.dropPrimary();
  });
  return knex.schema.dropTableIfExists('article');
};
