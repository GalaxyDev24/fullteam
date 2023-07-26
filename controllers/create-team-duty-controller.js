var knex = require('lib/knex');
var q = require('q');
var async = require('async');
var validator = require('node-validator');
var log = require('helpers/logger');

var Controller = require('controllers/controller');
var NotificationService = require('services/notification-service');

function CreateTeamDutyController() {
  var ctrl = new Controller(this);
  this.createTeamDuty = function(request, response, app) {
    var data = request.data;
    var deferred = q.defer();

    async.waterfall([
      // Validate params
      function(callback) {
        var check = validator.isAnyObject()
            .withRequired('DutyName', validator.isString())
            .withRequired('TeamID', validator.isInteger());
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
        knex('teams').select(['id', 'manager_id']).where('id', data.TeamID)
          .then(function(results) {
            if (results.length == 0) {
              return ctrl.errorCallback(callback, 1,
                                        "Team with this ID cannot be found.");
            }
            if (results[0].manager_id != request.userID) {
              return ctrl.errorCallback(callback, 2,
                                        "You need to be the team manager to do this.");
            }
            return callback(null);
          })
          .catch(function(err) {
            return ctrl.errorCallback(callback, 1,
                                      "Unknown error.");
          });
      },

      // Create the duty
      function(callback) {
        knex('team_duties').insert({
          team_id: data.TeamID,
          duty_name: data.DutyName
        })
          .then(function(results) {
            return callback(null, {
              Success: 0,
              Description: null,
            });
          })
          .catch(function(err) {
            return ctrl.errorCallback(callback, 1,
                                      "Unknown error.");
          });
      }], ctrl.asyncCallback(deferred));
    return deferred.promise;
  };

  return this;
}

module.exports = new CreateTeamDutyController();

