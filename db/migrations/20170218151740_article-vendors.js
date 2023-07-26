
exports.up = function(knex, Promise) {
  return knex.schema.createTableIfNotExists('article_vendors', 
    function(table) {
      table.bigIncrements('id').primary();
      table.string('name').notNullable();
      table.string('picture').notNullable();
    })
};

exports.down = function(knex, Promise) {
  knex.schema.table('article_vendors', function(table) {
    table.dropPrimary();
  });
  return knex.schema.dropTableIfExists('article_vendors');
};
