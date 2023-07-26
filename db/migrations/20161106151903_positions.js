
exports.up = function(knex, Promise) {
  return knex.schema.createTableIfNotExists('positions', function(table){
    table.bigIncrements('id');
    table.string('name', 64);
    table.string('short_name', 4);
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTableIfExists('positions');
};
