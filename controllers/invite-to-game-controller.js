var knex = require('lib/knex');
var q = require('q');
var async = require('async');
var validator = require('node-validator');
var log = require('helpers/logger');
var NotificationService = require('services/notification-service');
var moment = require('moment');

var Controller = require('controllers/controller');
var BlockedUsersService = require('services/blocked-users-service');
var firebase = require('helpers/firebase');

function InviteToGameController() {
  var ctrl = new Controller(this);

  this.inviteToGame = function(request, response, app) {
    var data = request.data;
    var deferred = q.defer();
    var games = {};
    var teams = {};

    async.waterfall([
      // Validate params
      function(callback) {
        var check = validator.isAnyObject()
            .withRequired('GameID', validator.isInteger())
            .withRequired('UserIDs', validator
                          .isArray(validator.isInteger()));
        validator.run(check, data, function(errCount, errors) {
          if (!errCount) {
            return callback(null);
          }
          log.error(errors);
          return ctrl.errorCallback(callback, 1,
                                    "Invalid Parameters");
        });
      },

      // Check if you're the owner
      function(callback) {
        knex('games')
          .select(['id', 'owner_id', 'is_team_game', 'team_id'])
          .where({id: data.GameID})
          .then(function(results) {
            if (results.length == 0) {
              return ctrl.errorCallback(callback, 10,
                                        "Game doesn't exist");
            }
            if (results[0].owner_id != request.userID) {
              return ctrl.errorCallback(callback, 2,
                                        "Must be game owner");
            }

            games.is_team_game = results[0].is_team_game;
            games.team_id = results[0].team_id;

            return callback(null);
          })
          .catch(function(err) {
            return ctrl.errorCallback(callback, 1,
                                      "Unknown error. #1");
          });
      },

      // Get team Name
      function(callback) {
        if (typeof games.is_team_game === 'undefined' 
          || typeof games.team_id === 'undefined'
          || games.is_team_game == false 
          || games.team_id == -1) {
          return callback(null);
        }

        knex('teams')
          .select(['name'])
          .where({id: games.team_id})
          .whereNull('deleted_at')
          .then(function(results) {
            if (results.length == 0) {
              return ctrl.errorCallback(callback, 10,
                "Team doesn't exist");
            }

            teams.name = results[0].name;
            return callback(null);
          })
          .catch(function(err) {
            return ctrl.errorCallback(callback, 1,
              "Unknown error. #1");
          });
      },

      // Check if inviting yourself
      //function(callback) {
      //  for(var ii = 0; ii < data.UserIDs.length; ++ii) {
      //    if (data.UserIDs[ii] == request.userID) {
      //      return ctrl.errorCallback(callback, 3, "Can't invite yourself");
      //    }
      //  }
      //  return callback(null);
      //},

      // Check if any users blocked
      function(callback) {
        // So, this might be quite slow, as i'm making 1 req per
        // invite ID, however it all happens asynchronously, so
        // shouldn't be too slow? Could definitely optimise here.
        var finalList = [];
        var tasks = [];
        // Copy user IDs to final list
        for(var ii = 0; ii < data.UserIDs.length; ++ii) {
          finalList.push(data.UserIDs[ii]);
        }

        for (var ii = 0; ii < data.UserIDs.length; ++ii) {
          tasks.push((function(thisUserID){
            var task = q.defer();
            BlockedUsersService
              .isUserBlocked(request.userID, thisUserID)
              .then(function(result) {
                if (!result) {
                  task.resolve();
                }
                else {
                  // Remove userID from list
                  var index = finalList.indexOf(thisUserID);
                  if (index != -1) {
                    finalList.splice(index, 1);
                  }
                  task.resolve();
                }
              });
            return task.promise;

          })(data.UserIDs[ii]));
        }

        Promise.all(tasks).then(function() {
          data.UserIDs = [];
          // Copy the modified list to data.UserIDs
          for(var ii = 0; ii < finalList.length; ++ii) {
            data.UserIDs.push(finalList[ii]);
          }

          callback(null);
        }, function(err) {
          console.log(err);
          return ctrl.errorCallback(callback, 1,
            "Unknown error. #2");
        });
      },

      // Remove invite duplicates
      function(callback) {
        knex('game_invites')
          .select(['user_id', 'game_id'])
          .where('game_id', data.GameID)
          .then(function(results) {
            var finalList = [];
            // Copy user IDs to final list
            for(var ii = 0; ii < data.UserIDs.length; ++ii) {
              finalList.push(data.UserIDs[ii]);
            }

            for(var ii = 0; ii < results.length; ++ii) {
              for(var jj = 0; jj < data.UserIDs.length; ++jj) {
                if (data.UserIDs[jj] == results[ii].user_id) {
                  // Remove the ID
                  var index = finalList.indexOf(data.UserIDs[jj]);
                  if (index != -1) {
                    finalList.splice(index, 1);
                  }
                }
              }
            }
            data.UserIDs = [];
            // Copy the modified list to data.UserIDs
            for(var ii = 0; ii < finalList.length; ++ii) {
              data.UserIDs.push(finalList[ii]);
            }
            return callback(null);
          })
          .catch(function(err) {
            return ctrl.errorCallback(callback, 1,
              "Unknown error. #3");
          });
      },

      // Get owner data
      function(callback) {
        knex('reg_info')
          .select(['name', 'last_name', 'picture'])
          .where({'user_id': request.userID})
          .then(function(results) {
            if (results.length == 0) {
              return ctrl.errorCallback(callback, 1,
                "Could not find reg info.");
            }
            callback(null, {firstName: results[0].name, 
              lastName: results[0].last_name, 
              pictureURL: results[0].picture});
          })
          .catch(function(err) {
            return ctrl.errorCallback(callback, 1,
              "Unknown error. #4");
          });
      },

      // Get game data for notif
      function(currData, callback) {
        knex('games').select(['game_type', 'game_time', 'is_custom_venue', 'venue', 'lat', 'lon'])
          .where('id', data.GameID)
          .then(function(results) {
            if (results.length == 0) {
              return ctrl.errorCallback(callback, 1,
                "Unknown error. #5");
            }
            currData.gameType = results[0].game_type;
            currData.gameTime = results[0].game_time;
            currData.isCustomVenue = results[0].is_custom_venue;
            currData.venue = results[0].venue;
            currData.lat = results[0].lat;
            currData.lon = results[0].lon;
            return callback(null, currData);
          })
          .catch(function(err) {
            log.error(err);
            return ctrl.errorCallback(callback, 1,
              "Unknown error. #5");
          });
      },

      // Insert data
      function(currData, callback) {
        var currTime = (new Date()).getTime();
        var tasks = [];
        data.UserIDs.forEach(function(playerID){
          var task = q.defer();
          tasks.push(task);
          knex('game_invites')
            .insert({
              game_id: data.GameID,
              user_id: playerID,
              time: currTime
            })
            .then(function(results) {
              var notification = {
                timestamp: (new Date()).getTime(),
                type: NotificationService.notificationTypes.GAME_INVITE,
                data: JSON.stringify({
                  GameID: data.GameID,
                  OwnerID: request.userID,
                  OwnerFirstName: currData.firstName,
                  OwnerLastName: currData.lastName,
                  OwnerPictureURL: currData.pictureURL,
                  GameType: currData.gameType,
                  GameTime: currData.gameTime,
                  IsCustomVenue: currData.isCustomVenue,
                  Venue: currData.venue,
                  Latitude: currData.lat,
                  Longitude: currData.lon,
                  TeamName: teams.name,
                }),
              };

              var notifMessage;

              var notifMessage = "You have received an invite to play a game at " 
                + currData.venue;

              console.log("Message: " + notifMessage);

              Promise.all([
                NotificationService.sendNotifications(
                  [playerID],
                  notification,
                  notifMessage,
                  app),
              ])
                .then(function() {
                  task.resolve();
                })
                .catch(function(err) {
                  task.reject(err);
                });
            })
            .catch(function(err) {
              task.reject(err);
            });
        });

        Promise.all(tasks)
          .then(function() {
            callback(null, {
              success: 0,
              Description: null
            });
          })
          .catch(function(err) {
            log.error(err);
            return ctrl.errorCallback(callback, 1,
              "Unknown error. #5");
          });
      },
    ], ctrl.asyncCallback(deferred));

    return deferred.promise;
  };

  return this;
}

module.exports = new InviteToGameController();

