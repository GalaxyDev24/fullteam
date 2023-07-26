var users = require('db/sample-data/sample-data.js').users;
var positions = require('db/sample-data/sample-data.js').positions;

exports.seed = function(knex, Promise) {

  var _positions = {};
  for (var i = 0; i < positions.length; i++) {
    _positions[positions[i].short_name] = positions[i].id;
  }

  // Deletes ALL existing entries
  return knex('player_positions').truncate().then(function() {
    var tasks = [];
    for (var i = 0; i < users.length; i++) {

      var csvPositions = users[i][10].split(',');
      for(var j = 0; j < csvPositions.length; j++) {

        var position = {
          user_id: i + 1,
          position_id: _positions[csvPositions[j]]
        };
        
        tasks.push(knex('player_positions').insert(position));  
      }
      
    }

    return Promise.all(tasks);
  });
};
