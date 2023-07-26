exports.up = function(knex, Promise) {
  return knex.schema.createTableIfNotExists('twitter_status', 
    function(table) {
      table.bigIncrements('id');
      table.string('id_str');
      table.dateTime('created_at');
      table.text('json');
    });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTableIfExists('twitter_status');
};
