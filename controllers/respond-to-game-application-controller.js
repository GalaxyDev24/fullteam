var knex = require('lib/knex');
var q = require('q');
var async = require('async');
var util = require('util');
var validator = require('node-validator');
var log = require('helpers/logger');
var NotificationService = require('services/notification-service');

var Controller = require('controllers/controller');
var firebase = require('helpers/firebase');

function RespondToGameApplicationController() {
  var ctrl = new Controller(this);

  this.respondToGameApplication = function(request, response, app) {
    var data = request.data;
    var deferred = q.defer();

    async.waterfall([
      // Validate params
      function(callback) {
        var check = validator.isAnyObject()
            .withRequired('GameID', validator.isInteger())
            .withRequired('UserID', validator.isInteger())
            .withRequired('Response', validator.isInteger());
        validator.run(check, data, function(errCount, errors) {
          if (!errCount) {
            return callback(null);
          }
          log.error(errors);
          return ctrl.errorCallback(callback, 1,
                                    "Invalid Parameters");
        });
      },

      // Check whether application & game exists & you are the
      // owner
      function(callback) {
        knex.select(['games.id AS games_id', 'user_id', 'game_id',
                     'game_time', 'owner_id'])
          .from('games')
          .leftJoin('teams', 'teams.id', 'games.team_id')
          .leftJoin('game_applications', 'game_id', 'games.id')
          .where('games.id', data.GameID)
          .whereNull('teams.deleted_at')
          .then(function(results) {
            // Does game still exist?
            if (results.length == 0 ||
                results[0].game_time < (new Date()).getTime()) {
              return ctrl.errorCallback(callback, 10,
                                        "Game doesn't exist");
            }

            // Check you own the game
            if (results[0].owner_id != request.userID) {
              return ctrl.errorCallback(callback, 1,
                                        "You are not the owner");
            }
            
            // Loop through to check whether the given
            // user actually has an application. Yes, this
            // could be done with another SQL query, but
            // db queries are probably going to be the
            // bottleneck. If we have performance problems
            // with this (we probably won't) we can always
            // measure later on. Keeps the code more
            // simple too.
            for(var ii = 0; ii < results.length; ++ii) {
              if (results[ii].user_id == data.UserID) {
                return callback(null);
              }
            }
            return ctrl.errorCallback(callback, 1,
                                      "Application doesn't exist");
          })
          .catch(function(err) {
            log.error(err);
            return ctrl.errorCallback(callback, 1,
                                      "Unknown Error");
          });
      },

      // Get owner details
      function(callback) {
        knex('reg_info').select(['name', 'last_name', 'picture', 'user_id'])
          .where('user_id', request.userID)
          .then(function(results) {
            if (results.length == 0) {
              return ctrl.errorCallback(callback, 1,
                                        "Can't find owner details");
            }
            callback(null, results[0].name, results[0].last_name, results[0].picture);
          })
          .catch(function(err) {
            ctrl.errorCallback(callback, 1,
                               "Unknown error");
          });
      },

      function(ownerFirstName, ownerLastName, ownerPictureURL, callback) {
        knex.transaction(function(trx) {
          var catchFunc = function(err) {
            log.error(err);
            trx.rollback();
            return ctrl.errorCallback(callback, 1,
                                      "Unknown error");
          };
          var deleteGameApplication = function() {
            knex('game_applications')
              .transacting(trx)
              .del()
              .where({game_id: data.GameID,
                      user_id: data.UserID})
              .then(function() {
                trx.commit();
                var notification = {
                  timestamp: (new Date()).getTime(),
                  type: NotificationService.notificationTypes.GAME_APPLICATION_RESPONSE,
                  data: JSON.stringify({
                    OwnerID: request.userID,
                    GameID: data.GameID,
                    Response: data.Response,
                    UserID: data.UserID,
                    FirstName: ownerFirstName,
                    LastName: ownerLastName,
                    PictureURL: ownerPictureURL
                  })
                };
                Promise.all([
                  NotificationService.sendNotifications(
                    [data.UserID],
                    notification,
                    "Your game application has been responded to!",
                    app),
                ])
                  .then(function() {
                    callback(null, {
                      success: 0,
                      Description: null
                    });
                  });
              })
              .catch(catchFunc);
          };
          if (data.Response == 1) {
            // Get positions open
            knex('game_players').select(['position'])
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
                knex('game_players')
                  .transacting(trx)
                  .insert({game_id: data.GameID,
                           user_id: data.UserID,
                           position: position})
                  .then(deleteGameApplication)
                  .catch(catchFunc);
              })
              .catch(catchFunc);
          }
          else {
            deleteGameApplication();
          }
        })
      },
    ], ctrl.asyncCallback(deferred));

    return deferred.promise;
  };

  return this;
}

module.exports = new RespondToGameApplicationController();
