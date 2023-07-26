var knex = require('lib/knex');
var q = require('q');
var async = require('async');
var validator = require('node-validator');
var log = require('helpers/logger');

var Controller = require('controllers/controller');
var NotificationService = require('services/notification-service');

function RemoveTeamMemberDutyController() {
  var ctrl = new Controller(this);
  this.removeTeamMemberDuty = function(request, response, app) {
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
          .innerJoin('team_duties', 'team_id', 'teams.id')
          .where('team_duties.id', data.DutyID)
          .then(function(results) {
            if (results.length == 0) {
              return ctrl.errorCallback(callback, 3,
                "Duty does not exist");
            }
            if (results[0].manager_id != request.userID) {
              return ctrl.errorCallback(callback, 2,
                "You need to be the team manager to do this.");
            }
            return callback(null);
          })
          .catch(function(err) {
            console.log(err);
            return ctrl.errorCallback(callback, 1, "Unknown error.");
          });
      },

      // Check user is assigned to duty
      function(callback) {
        let tasks = [];
        for (let ii = 0; ii < data.UserIDs.length; ++ii) {
          let userID = data.UserIDs[ii];
          let task = knex('team_duty_assignments').select(['duty_id', 'user_id'])
            .where({
              duty_id: data.DutyID,
              user_id: userID,
            })
            .then(function(results) {
              if (results.length == 0) { 
                throw userID; 
              }
            })
          tasks.push(task);
        }
        Promise.all(tasks)
          .then(function() {
            return callback(null);
          })
          .catch(function(err) {
            for (let ii = 0; ii < err.length; ++ii) {
              if (Number.isInteger(ii)) {
                let index = data.UserIDs.findIndex(function(e) { return e == err[ii]; });
                data.UserIDs.splice(index, 1);
              }
              else {
                return ctrl.errorCallback(callback, 1, "Unknown error.");
              }
            }
            // We haven't returned from a DB error, so we can move on.
            return callback(null);
          });
      },

      // Remove assignment
      function(callback) {
        let tasks = [];
        for (let ii = 0; ii < data.UserIDs.length; ++ii) {
          let userID = data.UserIDs[ii];
          let task = knex('team_duty_assignments').del()
            .where({ duty_id: data.DutyID, user_id: userID, })
          tasks.push(task);
        }
        Promise.all(tasks) 
          .then(function() {
            return callback(null, {
              Success: 0,
              Description: null
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

module.exports = new RemoveTeamMemberDutyController();


