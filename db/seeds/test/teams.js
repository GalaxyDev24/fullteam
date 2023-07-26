var users = require('db/sample-data/sample-data.js').users;
var teams = require('db/sample-data/sample-data.js').teams;
var moment = require('moment');

exports.seed = function(knex, Promise) {

    var tasks = [];
    for (var i = 0; i < teams.length; i++) {

        var sampleData = {
            id: i+1,
            name: teams[i][0],
            manager_id: teams[i][1],
            lat: users[teams[i][1]-1][5],
            lon: users[teams[i][1]-1][6],
            team_size: teams[i][2],
            formation: teams[i][3],
            created_at: moment().format("YYYY-MM-DD HH:mm:ss"),
            updated_at: moment().format("YYYY-MM-DD HH:mm:ss")
        };

        tasks.push(knex('teams').insert(sampleData));
    }

    // Deletes ALL existing entries
    return knex('teams').truncate().then(function() {
        return Promise.all(tasks);
    });

};
