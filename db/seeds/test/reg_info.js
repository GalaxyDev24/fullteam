var config = require('config');
var users = require('db/sample-data/sample-data').users;
var fs = require('fs-extra');
var path = require('path');

exports.seed = function(knex, Promise) {

    var tasks = [];
    for (var i = 0; i < users.length; i++) {

        var sampleImage = users[i][9];

        fs.copySync(
          path.resolve(__dirname,'../../sample-images/' + sampleImage), 
          path.resolve(__dirname,'../../../public/UserUploads/ProfilePictures/' + sampleImage)
        );

        var sampleImageURL = config.baseUrl + 'UserUploads/ProfilePictures/' + sampleImage;
        var sampleCoverImageURL = config.baseUrl + 'Assets/images/placeholders/profile-cover-placeholder.png';

        var sampleData = {
            user_id: i+1,
            name: users[i][0],
            last_name: users[i][1],
            picture: sampleImageURL,
            cover_picture: sampleCoverImageURL,
            birthday: users[i][3],
        };
        tasks.push(knex('reg_info').insert(sampleData));
    }

    // Deletes ALL existing entries
    return knex('reg_info').truncate().then(function() {
        return Promise.all(tasks);
    });

};
