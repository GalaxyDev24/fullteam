
exports.up = function(knex, Promise) {
  return knex.schema.table('notifications', function(table) {
    table.string('pretty_message').nullable();
  });

};

exports.down = function(knex, Promise) {
  return knex.schema.table('notifications', function(table) {
    table.dropColumn('pretty_message');
  });

};
