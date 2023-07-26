var users = require('db/sample-data/sample-data.js').users;

exports.seed = function(knex, Promise) {

    var hashes = {
        secret: '00000014000003e83fb1e7b2a4e3d1b00901b95ad6bccba0e71cca1886dc7eec60ae37b83014e0c92161b9ed589bba9f2ffd2b16',
    }

    var tasks = [];
    for (var i = 0; i < users.length; i++) {

        var sampleUser = {
            id: i+1,
            email: users[i][2],
            pass: hashes['secret'],
            last_active: 0,
            online: 0
        };

        tasks.push(knex('user').insert(sampleUser));
    }

    // Deletes ALL existing entries
    return knex('user').truncate().then(function() {
        return Promise.all(tasks);
    });
}
