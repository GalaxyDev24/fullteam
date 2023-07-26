var teams = require('db/sample-data/sample-data.js').teams;

exports.seed = function(knex, Promise) {

    var tasks = [];

    tasks.push(knex('team_followers').insert({team_id: 1, follower_id: 1 }));
    tasks.push(knex('team_followers').insert({team_id: 1, follower_id: 2 }));
    tasks.push(knex('team_followers').insert({team_id: 1, follower_id: 3 }));
    tasks.push(knex('team_followers').insert({team_id: 1, follower_id: 4 }));
    tasks.push(knex('team_followers').insert({team_id: 2, follower_id: 2 }));
    tasks.push(knex('team_followers').insert({team_id: 2, follower_id: 3 }));

    // Deletes ALL existing entries
    return knex('team_followers').truncate().then(function() {
        return Promise.all(tasks);
    });
};
