var knex = require('lib/knex');
var q = require('q');
var async = require('async');
var validator = require('node-validator');
var log = require('helpers/logger');
var NotificationService = require('services/notification-service');
var GameInviteService = require('services/game-invite-service');

var Controller = require('controllers/controller');
var firebase = require('helpers/firebase');

function RespondToGameInviteController() {
  var ctrl = new Controller(this);

  this.respondToGameInvite = function(request, response, app) {
    var data = request.data;
    var deferred = q.defer();

    async.waterfall([
      // Validate params
      function(callback) {
        var check = validator.isAnyObject()
            .withRequired('GameID', validator.isInteger())
            .withRequired('Response', validator.isInteger())
        validator.run(check, data, function(errCount, errors) {
          if (!errCount) {
            return callback(null);
          }
          log.error(errors);
          return ctrl.errorCallback(callback, 1,
                                    "Invalid Parameters");
        });
      },

      // Check game still exists, and you have an invite
      function(callback) {
        knex.select(['games.id', 'game_invites.user_id', 'games.game_time'])
          .from('games')
          .leftJoin('teams', 'teams.id', 'games.team_id')
          .leftJoin('game_invites', 'game_invites.game_id', 'games.id')
          .where('games.id', data.GameID)
          .whereNull('teams.deleted_at')
          .then(function(results) {
            if (results.length == 0 ||
                results[0].game_time <
                (new Date()).getTime()) {
               return ctrl.errorCallback(callback, 10,
                                         "Game doesn't exist");
            }
            
            var isInvited = false;
            for(var ii = 0; ii < results.length; ++ii) {
              if (results[ii].user_id == request.userID) {
                isInvited = true;
                break;
              }
            }
            if (!isInvited) {
              return ctrl.errorCallback(callback, 1,
                                        "No invite exists");
            }
            else {
              callback(null);
            }
          })
          .catch(function(err) {
            console.log(err);
            return ctrl.errorCallback(callback, 1,
                                      "Unknown error");
          });
      },

      // Check you are not already playing for some reason
      function(callback) {
        knex('game_players').select(['game_id', 'user_id'])
          .where({game_id: data.GameID, user_id: request.userID})
          .then(function(results) {
            if (results.length == 0) {
              return callback(null);
            }
            GameInviteService.deleteInvite(data.GameID, request.userID)
              .then(function() {
                ctrl.errorCallback(callback, 1,
                                   "Already playing in the game.");
              })
              .catch(function() {
                console.log(err);
                ctrl.errorCallback(callback, 1,
                                   "Unknown error");
              });
          });
      },

      // Get owner ID
      function(callback) {
        knex('games').select(['id', 'owner_id', 'game_type', 'game_time', 'is_custom_venue', 'venue', 'lat', 'lon'])
          .where('id', data.GameID)
          .then(function(results) {
            if (results.length == 0) {
              return ctrl.errorCallback(callback, 1,
                                        "Cannot get game owner");
            }
            callback(null, results[0]);
          })
          .catch(function(err) {
            console.log(err);
            return ctrl.errorCallback(callback, 1,
                                      "Unknown error");
          });
      },

      // Get user data
      function(game, callback) {
        knex('reg_info')
          .select(['name', 'last_name', 'picture', 'user_id'])
          .where('user_id', request.userID)
          .then(function(results) {
            if (results.length == 0) {
              return ctrl.errorCallback(callback, 1,
                                        "Cannot get user details");
            }
            callback(null, game, results[0].name, results[0].last_name, results[0].picture);
          })
          .catch(function(err) {
            console.log(err);
            return ctrl.errorCallback(callback, 1,
                                      "Unknown error");
          });
      },

      // Respond to invite
      function(game, firstName, lastName, pictureURL, callback) {
        var ownerID = game.owner_id;

        function sendNotif() {
          if (ownerID === request.userID) { return Promise.resolve(); }

          var notification = {
            timestamp: (new Date()).getTime(),
            type: NotificationService.notificationTypes.GAME_INVITE_RESPONSE,
            data: JSON.stringify({
              UserID: request.userID,
              GameID: data.GameID,
              Response: data.Response,
              FirstName: firstName,
              LastName: lastName,
              PictureURL: pictureURL,
              GameType: game.game_type,
              GameTime: game.game_time,
              IsCustomVenue: game.is_custom_venue,
              Venue: game.venue,
              Latitude: game.lat,
              Longitude: game.lon,
            })
          };

          var notifMessage = firstName + " " + lastName + " is " +
            ((data.Response==1)?"available":"unavailable") + " for your game at "
            game.venue;

          return Promise.all([
            NotificationService.sendNotifications(
              [ownerID],
              notification,
              notifMessage,
              app),
          ]);
        }
        knex.transaction(function(trx) {
          var catchFunc = function(err) {
            log.error(err);
            trx.rollback();
            return ctrl.errorCallback(callback, 1,
              "Unknown error");
          };
          if (data.Response == 1) {
            // Find first open position
            knex('game_players').select(['position', 'game_id'])
              .where('game_id', data.GameID)
              .orderBy('position', 'asc')
              .then(function(results) {
                // Find position to insert into (First position in
                // ascending list not taken)
                var position = 0;
                for (var ii = 0; ii < results.length; ++ii) {
                  if (results[ii].position != ii) {
                    position = ii;
                    break;
                  }
                  position ++;
                }

                // Insert data into game_players
                knex('game_players').transacting(trx)
                  .insert({game_id: data.GameID,
                    user_id: request.userID,
                    position: position})
                  .then(function() {
                    GameInviteService
                      .updateInviteStatus(data.GameID, request.userID, "available")
                      .then(function() {
                        sendNotif().then(function() {
                          trx.commit();
                          return callback(null, {
                            Success: 0, Description: null,
                          });
                        });
                      });
                  });
              })
              .catch(catchFunc);
          }
          else {
            GameInviteService
              .updateInviteStatus(data.GameID, request.userID, "unavailable")
              .then(function() {
                sendNotif().then(function() {
                    response.Success = 0;
                    response.Description = null;
                    return callback(null, response);
                  });
              });
          }
        });
      },
    ], ctrl.asyncCallback(deferred));
    return deferred.promise;
  };

  return this;
}

module.exports = new RespondToGameInviteController();

