var knex = require('lib/knex');
var q = require('q');
var async = require('async');
var validator = require('node-validator');
var log = require('helpers/logger');

var Controller = require('controllers/controller');
var NotificationService = require('services/notification-service');

function AssignDutyController() {
  var ctrl = new Controller(this);
  this.assignDuty = function(request, response, app) {
    var data = request.data;
    var deferred = q.defer();

    async.waterfall([
      // Validate params
      function(callback) {
        var check = validator.isAnyObject()
            .withRequired('DutyID', validator.isInteger())
            .withRequired('UserIDs', validator.isArray());
        validator.run(check, data, function(errCount, errors) {
          if (!errCount) {
            return callback(null);
          }
          log.error(errors);
          return ctrl.errorCallback(callback, 1,
                                    "Invalid Parameters");
        });
      },

      // Check you're the manager of the team
      function(callback) {
        knex('teams').select(['teams.id', 'manager_id', 'team_duties.id'])
          .innerJoin('team_duties', 'team_duties.team_id', 'teams.id')
          .where('team_duties.id', data.DutyID)
          .then(function(results) {
            if (results.length == 0) {
              return ctrl.errorCallback(callback, 3,
                                        "Duty doesn't exist");
            }
            if (results[0].manager_id != request.userID) {
              return ctrl.errorCallback(callback, 2,
                                        "You need to be the team manager to do this.");
            }
            return callback(null);
          })
          .catch(function(err) {
            log.error(err);
            return ctrl.errorCallback(callback, 1,
                                      "Unknown error.");
          });
      },

      // Remove userIDs not part of team
      function(callback) {
        var finalList = [];
        knex('team_players').select(['team_players.team_id', 'user_id', 'team_duties.id'])
          .innerJoin('team_duties', 'team_duties.team_id', 'team_players.team_id')
          .where('team_duties.id', data.DutyID)
          .then(function(results) {
            for(var ii = 0; ii < results.length; ++ii) {
              for(var jj = 0; jj < data.UserIDs.length; ++jj) {
                if (data.UserIDs[jj] == results[ii].user_id) {
                  finalList.push(data.UserIDs[jj]);
                  break;
                }
              }
            }
            data.UserIDs = finalList;
            callback(null);
          })
          .catch(function(err) {
            log.error(err);
            return ctrl.errorCallback(callback, 1,
                                      "Unknown error.");
          });
      },

      // Remove userIDs already assigned
      function(callback) {
        var idsToRemove = [];
        knex('team_duty_assignments').select(['duty_id', 'user_id'])
          .where('duty_id', data.DutyID)
          .then(function(results) {
            for(var ii = 0; ii < results.length; ++ii) {
              for(var jj = 0; jj < data.UserIDs.length; ++jj) {
                if (data.UserIDs[jj] == results[ii].user_id) {
                  idsToRemove.push(data.UserIDs[jj]);
                  break;
                }
              }
            }
            for(var ii = 0; ii < idsToRemove.length; ++ii) {
              data.UserIDs.splice(data.UserIDs.indexOf(idsToRemove[ii]), 1);
            }
            callback(null);
          })
          .catch(function(err) {
            log.error(err);
            return ctrl.errorCallback(callback, 1,
                                      "Unknown error.");
          });
      },

      // Insert assignments
      function(callback) {
        var rows = [];
        for (var ii = 0; ii < data.UserIDs.length; ++ii) {
          rows.push({
            duty_id: data.DutyID,
            user_id: data.UserIDs[ii]
          });
        }
        knex.batchInsert('team_duty_assignments', rows)
          .then(function() {
            return callback(null, {
              Success: 0,
              Description: null,
            });
          })
          .catch(function(err) {
            log.error(err);
            return ctrl.errorCallback(callback, 1,
                                      "Unknown error.");
          });
      },
        ], ctrl.asyncCallback(deferred));
    return deferred.promise;
  };

  return this;
}

module.exports = new AssignDutyController();


