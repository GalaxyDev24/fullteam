var users = require('db/sample-data/sample-data.js').users;

exports.seed = function(knex, Promise) {

    var tasks = [];
    for (var i = 0; i < users.length; i++) {
        
        var sampleData = {
            user_id: i+1,
            lat: users[i][5],
            lon: users[i][6],
            locality: users[i][7],
            country: users[i][8],
        };

        tasks.push(knex('user_location').insert(sampleData));
    }

    // Deletes ALL existing entries
    return knex('user_location').truncate().then(function() {
        return Promise.all(tasks);
    });
};
