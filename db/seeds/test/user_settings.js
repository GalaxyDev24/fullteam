var users = require('db/sample-data/sample-data.js').users;

exports.seed = function(knex, Promise) {

    var tasks = [];
    for (var i = 0; i < users.length; i++) {
        var sampleData = {
            user_id: i+1,
            comments: 1,
            notifications: 1,
            searchable: 1
        };
        tasks.push(knex('user_settings').insert(sampleData));
    }

    // Deletes ALL existing entries
    return knex('user_settings').truncate().then(function() {
        return Promise.all(tasks);
    });
};
