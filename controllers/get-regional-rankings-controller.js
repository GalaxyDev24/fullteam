var knex = require('lib/knex'),
  q = require('q'),
  config = require('config'),
  async = require('async'),
  util = require('util'),
  validator = require('node-validator'),
  validate = require("validate.js"),
  log = require('helpers/logger');

var Controller = require('controllers/controller');

var requestConstraints = {
  UserID: {
    presence: {
      message: "is required"
    }
  },
};

function GetRegionalRankingsController() {
  var ctrl = new Controller(this);
  this.getRankings = function(packet) {
    var distance = 20;
    var data = packet.data;
    var response = {};
    var deferred = q.defer();
    async.waterfall([
      // Data validation...
      function(callback) {
        var errors = validate(data, requestConstraints);

        if (!errors) {
          return callback(null);
        }

        return ctrl.errorCallback(callback, 1, "Invalid Parameters", errors);

      },
      // Get user location...
      function(callback) {
        knex.select([
          'lat',
          'lon',
          'locality',
          'country',
        ])
          .from('user_location')
          .where('user_id', data.UserID)
          .first()
          .then(function(userLocation) {

            if (typeof userLocation === 'undefined') {
              return ctrl.errorCallback(callback, 1, "User not found");
            }

            response.UserLocation = userLocation;

            return callback(null);

          }, function(err) {
            return ctrl.errorCallback(callback, 1, "User location does not exist.");
          });
      },
      // Get user average rating
      function(callback) {
        knex.select([
          knex.raw("IFNULL(AVG(average), -1) as rating"),
        ])
          .from('user_feedback')
          .where('profile_user_id', data.UserID)
          .first()
          .then(function(userRating) {
            response.UserRating = userRating.rating;
            return callback(null);
          }, function(err) {
            return ctrl.errorCallback(callback, 1, "User location does not exist.");
          });
      },

      // Get number of users having better rating in that region...
      function(callback) {

        // SELECT count(u.id)
        // FROM user u  
        // LEFT JOIN (SELECT user_id, searchable FROM user_settings) us ON us.user_id = u.id  
        // LEFT JOIN (SELECT lat, lon, GETDISTANCE(lat, lon, 0, 0) AS distance, user_id FROM user_location) ul ON ul.user_id = u.id 
        // LEFT JOIN (SELECT AVG(average) as rating, profile_user_id FROM user_feedback GROUP BY profile_user_id) uf ON uf.profile_user_id = u.id 
        // LEFT JOIN reg_info ri ON ri.user_id = u.id 
        // WHERE 1 = 1
        // AND us.searchable = 1 
        // AND ul.distance < 100
        // AND uf.rating > (SELECT AVG(average) FROM user_feedback WHERE user_feedback.profile_user_id = 2)
        // ORDER BY uf.rating DESC;

        knex.select([
          knex.raw("count(user.id) as num_users"),
        ])
          .from('user')
          .joinRaw('LEFT JOIN (SELECT user_id, searchable FROM user_settings) us ON us.user_id = user.id')
          .joinRaw('LEFT JOIN (SELECT lat, lon, GETDISTANCE(lat, lon, ?, ?) AS distance, user_id FROM user_location) ul ON ul.user_id = user.id ', [response.UserLocation.lat, response.UserLocation.lon])
          .joinRaw('LEFT JOIN (SELECT AVG(average) as rating, profile_user_id FROM user_feedback GROUP BY profile_user_id) uf ON uf.profile_user_id = user.id ')
        // .where('us.searchable', 1)
          .where('ul.distance', '<', distance)
          .where('uf.rating', '>', response.UserRating)
          .first()
          .then(function(numUsers) {

            if (typeof numUsers === 'undefined') {
              return ctrl.errorCallback(callback, 1, "User not found");
            }
            response.UserRanking = parseInt(numUsers.num_users) + 1;
            return callback(null);
          }, function(err) {
            return ctrl.errorCallback(callback, 1, "Unknown error");
          });
      },

      // Get number of users in that region...
      function(callback) {

        // SELECT count(u.id)
        // FROM user u  
        // LEFT JOIN (SELECT user_id, searchable FROM user_settings) us ON us.user_id = u.id  
        // LEFT JOIN (SELECT lat, lon, GETDISTANCE(lat, lon, '-20.37', '57.61') AS distance, user_id FROM user_location) ul ON ul.user_id = u.id 
        // LEFT JOIN reg_info ri ON ri.user_id = u.id 
        // WHERE 1 = 1
        // AND us.searchable = 1 
        // AND ul.distance < 100

        knex.select([
          knex.raw("count(user.id) as num_users"),
        ])
          .from('user')
          .joinRaw('LEFT JOIN (SELECT user_id, searchable FROM user_settings) us ON us.user_id = user.id  ')
          .joinRaw('LEFT JOIN (SELECT lat, lon, GETDISTANCE(lat, lon, ?, ?) AS distance, user_id FROM user_location) ul ON ul.user_id = user.id ', [response.UserLocation.lat, response.UserLocation.lon])
          .joinRaw('LEFT JOIN reg_info ri ON ri.user_id = user.id ')
          .where('us.searchable', 1)
          .where('ul.distance', '<', distance)
          .first()
          .then(function(numUsers) {

            if (typeof numUsers === 'undefined') {
              return ctrl.errorCallback(callback, 1, "User not found");
            }

            response.UsersInRegion = parseInt(numUsers.num_users);
            return callback(null);
          }, function(err) {
            return ctrl.errorCallback(callback, 1, "Unknown error");
          });
      },

      // Get the list of top 10 users in that region...
      function(callback) {

        // SELECT
        // u.id,
        // ri.name as FirstName,
        // ri.last_name as LastName,
        // ri.picture as PictureURL,
        // uf.rating as Rating
        // FROM user u  
        // LEFT JOIN (SELECT user_id, searchable FROM user_settings) us ON ub
        // LEFT JOIN (SELECT lat, lon, GETDISTANCE(lat, lon, '-20.37', '57.61') AS distance, user_id FROM user_location) ul ON ul.user_id = u.id 
        // LEFT JOIN (SELECT AVG(average) as rating, profile_user_id FROM user_feedback GROUP BY profile_user_id) uf ON uf.profile_user_id = u.id 
        // LEFT JOIN reg_info ri ON ri.user_id = u.id 
        // WHERE 1 = 1
        // AND us.searchable = 1 
        // AND ul.distance < 100
        // ORDER BY uf.rating DESC;

        var followedByCurrentUser = 
          knex.raw('SELECT 1 FROM user_followers WHERE user_id = user.ID AND follower_id = ?', [packet.userID])
          .wrap('IFNULL((', '), 0) as FollowedByCurrentUser');

        knex.select([
          'user.id',
          knex.raw("reg_info.name as FirstName"),
          knex.raw("reg_info.last_name as LastName"),
          knex.raw("reg_info.picture as PictureURL"),
          knex.raw("uf.rating as Rating"),
          knex.raw("ucs.chat_user_id as ChatUserID"),
          followedByCurrentUser
        ])
          .from('user')
          .joinRaw('INNER JOIN user_chat_sessions ucs ON ucs.user_id = user.id')
          .joinRaw('LEFT JOIN (SELECT user_id, searchable FROM user_settings) us ON us.user_id = user.id  ')
          .joinRaw('LEFT JOIN (SELECT lat, lon, GETDISTANCE(lat, lon, ?, ?) AS distance, user_id FROM user_location) ul ON ul.user_id = user.id ', [response.UserLocation.lat, response.UserLocation.lon])
          .joinRaw('LEFT JOIN (SELECT AVG(average) as rating, profile_user_id FROM user_feedback GROUP BY profile_user_id) uf ON uf.profile_user_id = user.id ')
          .joinRaw('LEFT JOIN reg_info ON reg_info.user_id = user.id ')
          .whereNotNull('uf.rating')
          .where('us.searchable', 1)
          .where('ul.distance', '<', distance)
          .orderBy('uf.rating', 'desc')
          .limit(10)
          .then(function(LeaderBoard) {

            if (typeof LeaderBoard === 'undefined') {
              return ctrl.errorCallback(callback, 1, "Could not retreive leaderboard");
            }

            response.LeaderBoard  = LeaderBoard;
            return callback(null, response);
          }, function(err) {
            return ctrl.errorCallback(callback, 1, "Unknown error");
          });
      },

    ], ctrl.asyncCallback(deferred));
    return deferred.promise;
  };
}

module.exports = new GetRegionalRankingsController();
