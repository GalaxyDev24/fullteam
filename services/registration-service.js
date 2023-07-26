var knex = require('lib/knex');
var q = require('q');
var async = require('async');
var ChatService = require('services/chat-service');
var NotificationService = require('services/notification-service');
module.exports = (function() {

  function emailExists(email) {

    var deferred = q.defer();

    knex('user').where({
      'email': email
    }).select('id').then(function(results) {
      if (results.length > 0) {
        deferred.resolve(true);
        return;
      }

      deferred.resolve(false);
    });
    return deferred.promise;
  }

  function registerUser(userData) {

    var deferred = q.defer();
    
    async.waterfall([
      function(callback) {

        var userInfo = {
          email: userData.email,
          pass: userData.password,
          gender: userData.gender,
          age: userData.age,
          mobile_number: userData.mobile_number, 
          last_active: (new Date()).getTime(),
        };

        knex('user').insert(userInfo, 'id').then(function(userID) {
          callback(null, userID);
        }, function(err) {
          console.log("user");
          console.log(err);
          callback(err);
        });
      },

      // Insert positions
      function(userID, callback) {
        var positionsInfo = [];
        for (var ii = 0; ii < userData.positions.length; ++ii) {
          positionsInfo.push({
            user_id: userID,
            position_id: userData.positions[ii],
          });
        }
        knex.batchInsert('player_positions', positionsInfo, 4)
          .then(function() {
            callback(null, userID);
          })
          .catch(function(err) {
            console.log("player_positions");
            console.log(err);
            callback(err);
          });
      },

      function(userID, callback) {

        var registrationInfo = {
          user_id: userID,
          name: userData.firstName,
          last_name: userData.lastName,
          picture: userData.pictureURL,
          cover_picture: userData.coverPictureURL,
          birthday: userData.birthday
        };

        knex('reg_info').insert(registrationInfo).then(function() {
          callback(null, userID);
        }, function(err) {
          console.log("reg_info");
          console.log(err);
          callback(err);
        });

      },
      function(userID, callback) {

        var userSettingsInfo = {
          user_id: userID,
          comments: 1,
          notifications: 1,
          searchable: 1,
        };


        knex('user_settings').insert(userSettingsInfo).then(function() {
          callback(null, userID);
        }, function(err) {
          console.log("user_settings");
          console.log(err);
          callback(err);
        });
      },
      function(userID, callback) {

        var userLocationInfo = {
          user_id: userID,
          lat: userData.lat,
          lon: userData.lon,
          locality: userData.locality,
          country: userData.country
        };

        knex('user_location').insert(userLocationInfo).then(function() {
          callback(null, userID);
        }, function(err) {
          console.log("user_location");
          console.log(err);
          callback(err);
        });
      },

      function(userID, callback) {
        if (typeof userData.GCMIDs === 'undefined' || !userData.GCMIDs) {
          return callback(null, userID);
        }

        var promises = [];
        for (var i = 0; i < userData.GCMIDs.length; i++) {
          promises.push(NotificationService.addGCMID(userID, userData.GCMIDs[i]));
        }

        Promise.all(promises).then(function() {
          callback(null, userID);
        }, function(err) {
          logger.log("Error adding notification tokens: " + err);
          callback(err);
        });
      },

      function(userID, callback) {

        if (typeof userData.facebookID === 'undefined' || !userData.facebookID) {
          return callback(null, userID);
        }
        
        var facebookIdInfo = {
          user_id: userID,
          facebook_id: userData.facebookID,
        };

        knex('facebook_ids').insert(facebookIdInfo).then(function() {
          callback(null, userID);
        }, function(err) {
          console.log("facebook_ids");
          console.log(err);
          callback(err);
        });
      },

      function(userID, callback) {
        ChatService.getChatSession(userID).then(function() {
          callback(null, userID);
        }, function(err) {
          console.log("err chat session");
          console.log(err);
          callback(err);
        });
      },
    ], function(err, result) {

      console.log(err);
      console.log(result);
      if (err) {
        deferred.reject(err);
        return;
      }
      deferred.resolve(result);
    });

    return deferred.promise;
  };

  return {
    emailExists: emailExists,
    registerUser: registerUser,
  };

})();
