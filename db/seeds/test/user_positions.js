var users = require('db/sample-data/sample-data.js').users;

exports.seed = function(knex, Promise) {
  // Deletes ALL existing entries
  return knex('user_positions').truncate().then(function() {
    var tasks = [];
    for (var i = 1; i < users.length + 1; i++) {
      var position = {
        user_id: i,
        position: 0
      };
      tasks.push(knex('user_positions').insert(position));
    }
    return Promise.all(tasks);
  });
};
