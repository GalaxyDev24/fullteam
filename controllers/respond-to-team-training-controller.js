var knex = require('lib/knex');
var q = require('q');
var async = require('async');
var validator = require('node-validator');
var log = require('helpers/logger');

var Controller = require('controllers/controller');
var ValidatorsService = require('services/validators');

function RespondToTeamTrainingController() {
  var ctrl = new Controller(this);
  this.respondToTeamTraining = function(request, response, app) {
    var data = request.data;
    var deferred = q.defer();

    async.waterfall([
      // Validate params
      function(callback) {
        var check = validator.isAnyObject()
            .withRequired('TeamID', validator.isInteger())
            .withRequired('Response', validator.isInteger({min: 0, max: 2}));
        validator.run(check, data, function(errCount, errors) {
          if (!errCount) {
            return callback(null);
          }
          log.error(errors);
          return ctrl.errorCallback(callback, 1,
                                    "Invalid Parameters");
        });
      },

      // Check you're part of the team
      function(callback) {
        knex('team_players').select(['team_id', 'user_id'])
          .where({
            team_id: data.TeamID,
            user_id: request.userID,
          })
          .then(function(results) {
            if (results.length == 0) {
              return ctrl.errorCallback(callback, 2,
                                        "Must be part of the team to do this");
            }
            return callback(null);
          })
          .catch(function(err) {
            return ctrl.errorCallback(callback, 1,
                                      "Unknown error");
          });
      },

      // Check that there is a training session and a response for this team
      function(callback) {
        knex('team_training').select(['team_id', 'time', 'training_id', 'user_id'])
          .innerJoin('team_training_responses', 'training_id', 'id')
          .where('team_id', data.TeamID)
          .andWhere('user_id', request.userID)
          .then(function(results) {
            if (results.length == 0 || results[0].time < (new Date()).getTime()) {
              return ctrl.errorCallback(callback, 3,
                                        "No team training found");
            }
            return callback(null);
          })
          .catch(function(err) {
            return ctrl.errorCallback(callback, 1,
                                      "Unknown Error");
          });
      },

      // Set response code for this user
      function(callback) {
        knex('team_training_responses').update('response', data.Response)
          .leftJoin('team_training', 'training_id', 'id')
          .where({
            user_id: request.userID,
            team_id: data.TeamID
          })
          .then(function() {
            return callback(null, {
              Success: 0,
              Description: null,
            });
          })
          .catch(function(err) {
            log.error(err);
            return ctrl.errorCallback(callback, 1,
                                      "Unknown error");
          });
      },

    ], ctrl.asyncCallback(deferred));
    return deferred.promise;
  };

  return this;
}

module.exports = new RespondToTeamTrainingController();

