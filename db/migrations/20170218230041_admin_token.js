exports.up = function(knex, Promise) {
  return knex.schema.createTableIfNotExists('admin_token', 
    function(table) {
      table.string('token');
      table.bigInteger('valid_until');
    });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTableIfExists('article');
};
