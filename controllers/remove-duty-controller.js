var knex = require('lib/knex');
var q = require('q');
var async = require('async');
var validator = require('node-validator');
var log = require('helpers/logger');

var Controller = require('controllers/controller');
var NotificationService = require('services/notification-service');

function RemoveDutyController() {
  var ctrl = new Controller(this);
  this.removeDuty = function(request, response, app) {
    var data = request.data;
    var deferred = q.defer();

    async.waterfall([
      // Validate params
      function(callback) {
        var check = validator.isAnyObject()
            .withRequired('DutyID', validator.isInteger());
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

      // Remove duty assignments
      function(callback) {
        knex('team_duty_assignments').del()
          .where('duty_id', data.DutyID)
          .then(function() {
            callback(null);
          })
          .catch(function(err) {
            return ctrl.errorCallback(callback, 1,
                                      "Unknown error.");
          });
      },

      // Remove duty
      function(callback) {
        knex('team_duties').del()
          .where('id', data.DutyID)
          .then(function() {
            callback(null, {
              Success: 0,
              Description: null
            });
          })
          .catch(function(err) {
            return ctrl.errorCallback(callback, 1,
                                      "Unknown error.");
          });
      },

    ], ctrl.asyncCallback(deferred));
    return deferred.promise;
  };

  return this;
}

module.exports = new RemoveDutyController();


