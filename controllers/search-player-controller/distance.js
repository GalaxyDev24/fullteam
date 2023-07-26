var knex = require('lib/knex');
var q = require('q');
var async = require('async');
var util = require('util');
var validator = require('node-validator');
var log = require('helpers/logger');
var app = require('lib/application');
var urlFixer = require('helpers/url-fixer');
var User = require('models/user');
var UserLocation = require('models/user-location');
var Controller = require('controllers/controller');
var parseSearchResultsFunction = require('controllers/search-player-controller/common.js');

var ctrl = new Controller(this);

module.exports = function(packet) {
  var data = packet.data;
  var deferred = q.defer();

  var positionsTransformerGenerator = function() {
    return function(result) {
      var position = [];

      position = result.position_id;

      return position;
    };
  };

  var usersPositionTransformerGenerator = function(positions) {
    return function(result) {
      var userList = {};

      userList.UserID = result.id;
      userList.FirstName = result.name;
      userList.LastName = result.last_name;
      userList.PictureURL = result.picture;
      userList.CoverPictureURL = result.cover_picture;
      userList.Age = result.age;
      userList.AverageRating = result.rating;
      userList.Distance = result.distance;
      userList.Online = result.online;
      userList.LastActive = result.last_active;
      userList.Latitude = result.lat;
      userList.Longitude = result.lon;
      userList.ChatUserID = result.chat_user_id;

      if(userList.PictureURL) {
        userList.PictureURL = urlFixer(userList.PictureURL);
      }

      if(userList.CoverPictureURL) {
        userList.CoverPictureURL = urlFixer(userList.CoverPictureURL);
      }

      userList.Positions = positions.filter(function(item) {
        return item.user_id === result.id;
      }).map(positionsTransformerGenerator());

      return userList;
    };
  };

  async.waterfall([
    function(callback) {
      var check = validator.isAnyObject()
        .withRequired('SearchDistance', validator.isNumber())
        .withOptional('MinAge', validator.isInteger())
        .withOptional('MaxAge', validator.isInteger())
        .withOptional('MinRating', validator.isNumber())
        .withOptional('Positions', validator.isArray(validator.isInteger(), {min: 1}))
      ;
      validator.run(check, data, function(errCount, errors) {
        if (!errCount) {
          return callback(null);
        }
        log.error(errors);
        return ctrl.errorCallback(callback, 1, "Invalid parameters");
      });
    },

    // Select user location
    function (callback) {
      knex('user_location').select(['lat', 'lon'])
        .where('user_id', packet.userID)
        .then(function(results) {
          if (results.length === 0) {
            log.error("User location not found");
            ctrl.errorCallback(callback, 2, "No location for this user");
          }

          return callback(null, results[0].lat, results[0].lon);
        }, function(err) {
          log.error(err);
          ctrl.errorCallback(callback, 1, "Unknown error");
        });
    },

    // Fetch users nearby
    function (userLat, userLon, callback) {
      var userID = packet.userID;

      knex('user').select([
        'user_location.lat',
        'user_location.lon',
        'user.id',
        'reg_info.name',
        'reg_info.last_name',
        'reg_info.picture',
        'reg_info.cover_picture',
        'user_settings.searchable',
        knex.raw('AVG(user_feedback.average) as rating'),
        'user_location.distance',
        'user.last_active',
        'user.online',
        //'blocked_users.user_id', 
        //'blocked_users.other_user_id',
        'user_chat_sessions.chat_user_id',
        'user.age'
      ])
        .leftJoin('user_settings', 'user_settings.user_id', 'user.id')
        .leftJoin('user_chat_sessions', 'user_chat_sessions.user_id', 'user.id')          
        .leftJoin('user_feedback', 'user_feedback.profile_user_id', 'user.id')
        .leftJoin('reg_info', 'reg_info.user_id', 'user.id')
        //.joinRaw('LEFT JOIN blocked_users ON blocked_users.user_id = user.id OR blocked_users.other_user_id = user.id')
        .joinRaw('LEFT JOIN (SELECT lat, lon, GETDISTANCE(lat, lon, ?, ?) AS distance, user_id FROM user_location) AS user_location ON user_location.user_id = user.id', [userLat, userLon])
        .where('user.id', '<>', userID)
        .andWhere('user_settings.searchable', '=', 1)
        .andWhere('user_location.distance', '<', data.SearchDistance)
        //.andWhereRaw("user.id NOT IN (select blocked_users.user_id from blocked_users where blocked_users.other_user_id = ?)", [userID])
        //.andWhereRaw("user.id NOT IN (select blocked_users.other_user_id from blocked_users where blocked_users.user_id = ?)", [userID])
        .andWhere(function() {
          if(data.MinAge && data.MaxAge) {              
            this.whereBetween('user.age', [data.MinAge, data.MaxAge]);
          } else if (data.MinAge) {
            this.where('user.age', '>=', data.MinAge);
          } else if (data.MaxAge) {
            this.where('user.age', '<=', data.MaxAge);
          }
        })
        .andWhere(function() {
          if(data.Positions) {
            var subquery = knex('player_positions')
              .where('player_positions.position_id', 'in', data.Positions)
              .select('player_positions.user_id')
            ;
            this.where('user.id', 'in', subquery);  
          }
        })
        .groupBy('user.id')
        .orderBy('user.last_active', 'DESC')
      // .havingRaw("AVG(user_feedback.average) > ?", [2.6])
        .modify(function(query) {
          if(data.MinRating) {
            query.havingRaw("AVG(user_feedback.average) >= ?", [data.MinRating]);
          }
        })
        .then(function(users) {
          if (users.length === 0) {
            users = [];
          }

          return callback(null, users);
        }, function(err) {
          log.error(err);
          ctrl.errorCallback(callback, 1, "Unknown error");
        });
    },

    // Fetch users positions
    function (users, callback) {
      var userIDs = users.map(function(user){
        return user.id;
      });

      knex('player_positions').select()
        .whereIn('user_id', userIDs)
        .then(function(positions) {
          if (positions.length === 0) {
            positions = [];
          }

          var goalkeepers = [];
          var defenders = [];
          var midfielders = [];
          var attackers = [];

          for (var i = 0; i < positions.length; i++) {
            var position = positions[i].position_id;
            var this_user_id = positions[i].user_id;

            if ([0, 1].indexOf(position) >= 0) {
              if (goalkeepers.indexOf(this_user_id) === -1) {
                goalkeepers.push(this_user_id);
              }
            } else if ([6, 7, 8].indexOf(position) >= 0) {
              if (defenders.indexOf(this_user_id) === -1) {
                defenders.push(this_user_id);
              }
            } else if ([3, 4, 5].indexOf(position) >= 0) {
              if (midfielders.indexOf(this_user_id) === -1) {
                midfielders.push(this_user_id);
              }
            } else if ([2].indexOf(position) >= 0) {
              if (attackers.indexOf(this_user_id) === -1) { 
                attackers.push(this_user_id);          
              }
            }
          }

          var statistics = {
            "PlayersNearBy": users.length,
            "Goalkeepers": goalkeepers.length,
            "Defenders": defenders.length,
            "Midfielders": midfielders.length,
            "Attackers": attackers.length,
          };

          return callback(null, users, positions, statistics);
        }, function(err) {
          log.error(err);
          ctrl.errorCallback(callback, 1, "Unknown error");
        });
    },

    // Return response
    function (users, positions, statistics, callback) {
      var userList = users.map(usersPositionTransformerGenerator(positions));

      var response = {};
      response.UserList = userList;
      response.Statistics = statistics;
      response.Success = 0;
      response.Description = null;

      return callback(null, response);
    },

  ], ctrl.asyncCallback(deferred));
  return deferred.promise;
}
