var knex = require('lib/knex');
var q = require('q');
var async = require('async');
var validator = require('node-validator');
var log = require('helpers/logger');

var Controller = require('controllers/controller');
var NotificationService = require('services/notification-service');
var firebase = require('helpers/firebase');

function ApplyForGameController() {
  var ctrl = new Controller(this);
  this.applyForGame = function(request, response, app) {
    var data = request.data;
    var deferred = q.defer();

    async.waterfall([
      function(callback) {
        var check = validator.isAnyObject()
            .withRequired('GameID', validator.isInteger());
        validator.run(check, data, function(errCount, errors) {
          if (!errCount) {
            return callback(null);
          }
          log.error(errors);
          return ctrl.errorCallback(callback, 1,
                                    "Invalid Parameters");
        });
      },
      // Check whether application is valid
      function(callback) {
        // ----------------------------
        // CASE FOR FAILURE | (ERRCODE)
        // ----------------------------
        // GameFull         | (2)
        // AlreadyApplied   | (3)
        // AlreadyPlaying   | (4)
        // Played already   | (10)
        knex('games').select([
          'game_time',
          'game_applications.game_id as ga_game_id',
          'game_applications.user_id as ga_user_id',
          'game_players.game_id as gp_game_id',
          'game_players.user_id as gp_user_id'])
          .leftJoin('game_applications',
            'game_applications.game_id',
            'games.id')
          .leftJoin('game_players',
            'game_players.game_id',
            'games.id')
          .where({'games.id': data.GameID})
          .then(function(results) {
            if (results.length == 0) {
              return ctrl.errorCallback(callback, 1,
                "Game does not exist");
            }
            if (results[0].game_time <
              (new Date()).getTime()) {
              return ctrl.errorCallback(callback, 10,
                "Game already played");

            }
            for(var ii = 0; ii < results.length; ++ii) {
              if (results[ii].ga_user_id == request.userID) {
                return ctrl.errorCallback(callback, 3,
                  "Already applied");
              }
              if (results[ii].gp_user_id == request.userID) {
                return ctrl.errorCallback(callback, 4,
                  "Already playing");
              }
            }
            return callback(null);
          })
          .catch(function(err) {
            ctrl.errorCallback(callback, 1,
              "An unknown database " +
              "error has occurred");
          });
      },
      // Get owner ID (for notif)
      function(callback) {
        knex('games').select(['owner_id', 'id'])
          .where('id', data.GameID)
          .then(function(results) {
            if (results.length == 0) {
              return ctrl.errorCallback(callback, 1, "Cannot get game owner");
            }
            callback(null, results[0].owner_id)
          })
          .catch(function(err) {
            return ctrl.errorCallback(callback, 1, "Cannot get game owner");
          });
      },

      // Get user details (for notif)
      function(ownerID, callback) {
        knex('reg_info')
          .select(['user_id', 'name', 'last_name', 'picture'])
          .where('user_id', request.userID)
          .then(function(user) {
            callback(null, ownerID, user[0].name, user[0].last_name, user[0].picture);
          })
          .catch(function(err) {
            ctrl.errorCallback(callback, 1, "Cannot fetch user data");
          });
      },

      // Insert application
      function(ownerID, firstName, lastName, pictureURL, callback) {
        knex('game_applications')
          .insert({
            game_id: data.GameID,
            user_id: request.userID,
            time: (new Date()).getTime(),
          })
          .then(function() {
            callback(null, ownerID, firstName, lastName, pictureURL);
          })
          .catch(function (err) {
            log.error(err);
            ctrl.errorCallback(callback, 1, "Unknown error", err);
          });
      },

      // Send notification
      function(ownerID, firstName, lastName, pictureURL, callback) {
        var notification = {
          type: NotificationService.notificationTypes.GAME_APPLICATION,
          timestamp: (new Date()).getTime(),
          data: JSON.stringify({
            GameID: data.GameID,
            UserID: request.userID,
            FirstName: firstName,
            LastName: lastName,
            PictureURL: pictureURL 
          }),
        };
        var message = "Someone has applied to your game!";
        Promise.all([
          // Send in app notif
          NotificationService.sendNotifications(
            [ownerID],
            notification,
            message,
            app),
        ]).then(function() {
          return callback(null, {success: 0, Description: null});
        }).catch(function(err) {
          ctrl.errorCallback(callback, 1, "Unknown error");
        });
      },
    ], ctrl.asyncCallback(deferred));
    return deferred.promise;
  };

  return this;
}

module.exports = new ApplyForGameController();
