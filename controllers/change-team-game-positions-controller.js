var knex = require('lib/knex');
var q = require('q');
var async = require('async');
var validator = require('node-validator');
var log = require('helpers/logger');

var Controller = require('controllers/controller');
var NotificationService = require('services/notification-service');

function ChangeTeamGamePositionsController() {
  var ctrl = new Controller(this);
  this.changeTeamGamePositions = function(request, response, app) {
    var data = request.data;
    var deferred = q.defer();

    async.waterfall([
      function(callback) {
        var check = validator.isAnyObject()
            .withRequired('GameID', validator.isInteger())
            .withRequired('Positions', validator.isArray());
        validator.run(check, data, function(errCount, errors) {
          if (!errCount) {
            return callback(null);
          }
          log.error(errors);
          return ctrl.errorCallback(callback, 1,
                                    "Invalid Parameters");
        });
      },

      // Check you're the game owner
      function(callback) {
        knex('games').select(['id', 'owner_id'])
          .where('id', data.GameID)
          .then(function(results) {
            if (results.length == 0) {
              return ctrl.errorCallback(callback, 3,
                                        "No game with that ID found.");
            }
            if (results[0].owner_id != request.userID) {
              return ctrl.errorCallback(callback, 2,
                                        "You need to be the game owner to do that.");
            }
            return callback(null);
          })
          .catch(function(err) {
            log.error(err);
            return ctrl.errorCallback(callback, 1,
                                      "Invalid Parameters");
          });
      },

      // Check input data is valid
      function(callback) {
        knex('game_players').select(['game_id', 'user_id'])
          .where('game_id', data.GameID)
          .then(function(results) {

            // First check that all user IDs are covered
            if (results.length != data.Positions.length) {
              return ctrl.errorCallback(callback, 1,
                                        "Not enough positions specified");
            }
            for(var ii = 0; ii < results.length; ++ii) {
              var isInData = false;
              for(var jj = 0; jj < data.Positions.length; ++jj) {
                if (data.Positions[jj].UserID == results[ii].user_id) {
                  isInData = true;
                  break;
                }
              }
              if (!isInData) {
                return ctrl.errorCallback(callback, 1,
                                          "UserIDs not all specified");
              }
            }

            // Now check that all positions are within bounds (0 to
            // 100, 101 possible positions)
            for(var ii = 0; ii < data.Positions.length; ++ii) {
              if (data.Positions[ii].Position < 0 ||
                  data.Positions[ii].Position > 100) {
                return ctrl.errorCallback(callback, 1,
                                          "Position OOB");
              }
            }

            // Now check no positions are assigned to a duplicate.
            for(var ii = 0; ii < data.Positions.length; ++ii) {
              for (var jj = 0; jj < data.Positions.length; ++jj) {
                if (ii == jj) { continue; }
                if (data.Positions[ii].Position == data.Positions[jj].Position) {
                  return ctrl.errorCallback(callback, 1,
                                            "Position specified twice");
                }
              }
            }

            // No issues, done.
            callback(null);
          })
          .catch(function(err) {
            log.error(err);
            return ctrl.errorCallback(callback, 1,
                                      "Unknown error");
          });
      },

      // Update old positions
      function(callback) {
        var tasks = [];
        for (var ii = 0; ii < data.Positions.length; ++ii) {
          var task = knex('game_players')
              .update('position', data.Positions[ii].Position)
              .where('user_id', data.Positions[ii].UserID);
          tasks.push(task);
        }
        Promise.all(tasks).then(function() {
          callback(null, {
            Success: 0,
            Description: null
          });
        })
          .catch(function(err) {
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

module.exports = new ChangeTeamGamePositionsController();
