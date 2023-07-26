var knex = require('lib/knex');
var q = require('q');
var async = require('async');
var validator = require('node-validator');
var log = require('helpers/logger');

var Controller = require('controllers/controller');
var NotificationService = require('services/notification-service');

function SetTeamManagerController() {
  var ctrl = new Controller(this);
  this.setTeamManager = function(request, response, app) {
    var data = request.data;
    var deferred = q.defer();

    async.waterfall([
      // Validate params
      function(callback) {
        var check = validator.isAnyObject()
            .withRequired('TeamID', validator.isInteger())
            .withRequired('UserID', validator.isInteger());
        validator.run(check, data, function(errCount, errors) {
          if (!errCount) {
            return callback(null);
          }
          log.error(errors);
          return ctrl.errorCallback(callback, 1,
                                    "Invalid Parameters");
        });
      },

      // Check that you're the manager
      function(callback) {
        knex('teams').select(['id', 'manager_id'])
          .where('id', data.TeamID)
          .then(function(results) {
            if (results.length == 0) {
              return ctrl.errorCallback(callback, 1,
                                        "Can't find team ID");
            }
            if (results[0].manager_id != request.userID) {
              return ctrl.errorCallback(callback, 2,
                                        "You are not the team manager");
            }
            return callback(null);
          })
          .catch(function(err) {
            return ctrl.errorCallback(callback, 1,
                                      "Unknown error");
          });
      },

      // Check that the userID given is part of the team
      function(callback) {
        knex('team_players').select(['team_id', 'user_id'])
          .where({
            'team_id': data.TeamID,
            'user_id': data.UserID,
          })
          .then(function(results) {
            if (results.length == 0) {
              return ctrl.errorCallback(callback, 3,
                                        "UserID given is not a part of the team");
            }
            callback(null);
          })
          .catch(function(err) {
            return ctrl.errorCallback(callback, 1,
                                      "Unknown error");
          });
      },

      function(callback) {
        knex('teams').update({
          manager_id: data.UserID
        })
          .where('id', data.TeamID)
          .then(function() {
            return callback(null, {
              Success: 0,
              Description: null
            });
          })
          .catch(function(err) {
            return ctrl.errorCallback(callback, 1,
                                      "Unknown error");
          });
      },
    ], ctrl.asyncCallback(deferred));
    return deferred.promise;
  };

  return this;
}

module.exports = new SetTeamManagerController();
