var knex = require('lib/knex');
var q = require('q');
var async = require('async');
var util = require('util');
var validator = require('node-validator');
var log = require('helpers/logger');
var NotificationService = require('services/notification-service');
var firebase = require('helpers/firebase');

var Controller = require('controllers/controller');

function LeaveGameController() {
  var ctrl = new Controller(this);

  this.leaveGame = function(request, response, app) {
    var data = request.data;
    var deferred = q.defer();

    async.waterfall([
      // Validate params
      function(callback) {
        var check = validator.isAnyObject()
            .withRequired('GameID', validator.isInteger())
        validator.run(check, data, function(errCount, errors) {
          if (!errCount) {
            return callback(null);
          }
          log.error(errors);
          return ctrl.errorCallback(callback, 1,
                                    "Invalid Parameters");
        });
      },

      // Check game exists, and you are in the game
      function(callback) {
        knex.select('game_id', 'user_id', 'game_time')
          .from('games')
          .leftJoin('game_players', 'game_id', 'games.id')
          .where('games.id', data.GameID)
          .then(function(results) {
            if (results.length == 0) {
              return ctrl.errorCallback(callback, 10,
                                        "Game doesn't exist");
            }
            // Loop through and check for user ID, faster
            // than another DB query
            for (var ii = 0; ii < results.length; ++ii) {
              if (results[ii].user_id == request.userID) {
                return callback(null);
              }
            }
            return ctrl.errorCallback(callback, 1,
                                      "You are not in this game");
          })
          .catch(function(err) {
            return ctrl.errorCallback(callback, 1,
                                      "Unknown error");
          });
      },

      // Get player details
      function(callback) {
        knex('reg_info').select(['name', 'last_name', 'picture', 'user_id'])
          .where('user_id', request.userID)
          .then(function(results) {
            if (results.length == 0) {
              return ctrl.errorCallback(callback, 1,
                                        "Unknown error");
            }
            callback(null, results[0].name, results[0].last_name, results[0].picture);
          })
          .catch(function(results) {
            return ctrl.errorCallback(callback, 1,
                                      "Unknown error");
          });
      },

      // Get game owner
      function(firstName, lastName, pictureURL, callback) {
        knex('games').select(['owner_id', 'id'])
          .where('id', data.GameID)
          .then(function(results) {
            if (results.length == 0) {
              return ctrl.errorCallback(callback, 1,
                                        "Unknown error");
            }
            callback(null, results[0].owner_id, firstName, lastName, pictureURL);
          })
          .catch(function(err) {
            return ctrl.errorCallback(callback, 1,
                                      "Unknown error");
          });
      },
      
      // Remove from game_players
      function(ownerID, firstName, lastName, pictureURL, callback) {
        knex.transaction(function(trx) {
          knex('game_players')
            .transacting(trx)
            .del()
            .where({
              game_id: data.GameID,
              user_id: request.userID
            })
            .then(function () {
              var notification = {
                type: NotificationService.notificationTypes.LEFT_GAME,
                timestamp: (new Date()).getTime(),
                data: JSON.stringify({
                  'UserID': request.userID,
                  'GameID': data.GameID,
                  'FirstName': firstName,
                  'LastName': lastName,
                  'PictureURL': pictureURL,
                }),
              };
              return Promise.all([
                NotificationService.sendNotifications(
                  [ownerID],
                  notification,
                  "Someone left the game!",
                  app),
              ])
                .then(function() {
                  trx.commit();
                  return callback(null, {
                    success: 0,
                    Description: null
                  });
                });
            })
            .catch(function(err) {
              trx.rollback();
              log.error(err);
              return ctrl.errorCallback(callback, 1,
                "Unknown error");
            });
        })
          .catch(function(err) {
            trx.rollback();
            log.error(err);
            return ctrl.errorCallback(callback, 1,
              "Unknown error");
          });
      }
    ], ctrl.asyncCallback(deferred));
    return deferred.promise;
  };

  return this;
}

module.exports = new LeaveGameController();
