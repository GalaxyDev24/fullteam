
var positions = require('db/sample-data/sample-data.js').positions;

exports.seed = function(knex, Promise) {

  tasks = []; 
  for (var i = 0; i < positions.length; i++) {
    tasks.push(knex('positions').insert(positions[i]));
  }
  // Deletes ALL existing entries
  return knex('positions').truncate().then(function() {
      return Promise.all(tasks);
  });
};