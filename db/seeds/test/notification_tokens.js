exports.seed = function(knex, Promise) {

    var tokens = [
        [1, 'GCM', 'abcdefghijklmnopqrstuvwxyz001'],
        [2, 'GCM', 'abcdefghijklmnopqrstuvwxyz002'],
        [3, 'GCM', 'abcdefghijklmnopqrstuvwxyz003'],
        [4, 'GCM', 'abcdefghijklmnopqrstuvwxyz004'],
    ];

    var tasks = [];
    for (var i = 0; i < tokens.length; i++) {
        
        var sampleData = {
            id: i+1,
            user_id: tokens[i][0],
            type: tokens[i][1],
            token: tokens[i][2]
        };

        tasks.push(knex('notification_tokens').insert(sampleData));
    }

    // Deletes ALL existing entries
    return knex('notification_tokens').truncate().then(function() {
        return Promise.all(tasks);
    });
};
