var knex = require('lib/knex');
var q = require('q');
var async = require('async');
var validator = require('node-validator');
var ValidatorsService = require('services/validators');
var log = require('helpers/logger');

var Controller = require('controllers/controller');

function UpdateTeamFinancesController() {
  var ctrl = new Controller(this);
  this.updateTeamFinances = function(request, response, app) {
    var data = request.data;
    var deferred = q.defer();

    async.waterfall([

      // Validate params
      function(callback) {
        var check = validator.isAnyObject()
            .withRequired('TeamID', validator.isInteger())
            .withRequired('UserID', validator.isInteger())
            .withRequired('Finances', validator.isInteger());
        validator.run(check, data, function(errCount, errors) {
          if (!errCount) {
            return callback(null);
          }
          log.error(errors);
          return ctrl.errorCallback(callback, 1,
                                    "Invalid Parameters");
        });
      },

      // Check if this user is the manager of the team
      function(callback) {
        knex('teams').select('manager_id')
          .where('id', data.TeamID)
          .then(function(results) {

            if (results.length === 0) {
              return ctrl.errorCallback(callback, 2, "Team doesn\'t exist");
            }

            if (results[0].manager_id !== request.userID) {
              return ctrl.errorCallback(callback, 3, "You are not the owner of this team");
            }
            
            return callback(null);
          }, function(err) {
            console.log(err);
            return ctrl.errorCallback(callback, 1, "Unknown error");
          });
      },

      // Check if this player is part of the team
      function(callback) {
        knex('team_players').select()
          .where('team_id', data.TeamID)
          .where('user_id', data.UserID)
          .then(function(results) {

            if (results.length === 0) {
              return ctrl.errorCallback(callback, 4, "The player must be part of this team");
            }
            
            return callback(null);
          }, function(err) {
            console.log(err);
            return ctrl.errorCallback(callback, 1, "Unknown error");
          });
      },

      // Return team finances info
      function(callback) {
        knex('team_players')
          .where('team_id', data.TeamID)
          .where('user_id', data.UserID)
          .update('finances', data.Finances)
          .then(function(results) {
            var response = {};
            return callback(null, response);
          })
          .catch(function(err) {
            log.error(err);
            return ctrl.errorCallback(callback, 1, "Unknown error");
          });
      },

    ], ctrl.asyncCallback(deferred));
    return deferred.promise;
  };

  return this;
}

module.exports = new UpdateTeamFinancesController();
