var users = require('db/sample-data/sample-data.js').users;
var teams = require('db/sample-data/sample-data.js').teams;

var teamplayers = [
    [1, 2, -1], 
    [1, 3, -1], 
    [1, 9, -1], 
    [1, 10, -1], 
    [1, 22, -1],
    [2, 20, -1], 
    [2, 21, -1], 
    [2, 22, -1], 
    [2, 23, -1], 
    [2, 24, -1], 
    [2, 25, -1],
    [3, 25, 1],
    [4, 25, 1],
];

exports.seed = function(knex, Promise) {

    var tasks = [];
    for (var i = 0; i < teamplayers.length; i++) {

        var sampleData = {
            team_id: teamplayers[i][0],
            user_id: teamplayers[i][1],
            position: teamplayers[i][2],
        };

        tasks.push(knex('team_invites').insert(sampleData));
    }

    // Deletes ALL existing entries
    return knex('team_invites').truncate().then(function() {
        return Promise.all(tasks);
    });
};
