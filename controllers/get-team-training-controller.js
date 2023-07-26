var knex = require('lib/knex');
var q = require('q');
var async = require('async');
var validator = require('node-validator');
var log = require('helpers/logger');

var Controller = require('controllers/controller');
var ValidatorsService = require('services/validators')

function GetTeamTrainingController() {
  var ctrl = new Controller(this);
  this.getTeamTraining = function(request, response, app) {
    var data = request.data;
    var deferred = q.defer();

    async.waterfall([
      // Validate params
      function(callback) {
        var check = validator.isAnyObject()
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

      // Get training data
      function(callback) {
        knex('games').select(['id', 'team_id', 'game_time AS time', 'description', 'is_custom_venue', 'venue', 'lat', 'lon', 'cost'])
          .where('team_id', data.TeamID)
          .where('owner_id', request.userID)
          .where('is_training', true)
          .where('game_type', "Training")
          .orderBy('game_time', 'asc')
          .then(function(results) {
            if (results.length == 0 || results[0].time < (new Date()).getTime()) {
              return ctrl.errorCallback(callback, 3,
                                        "No team training found");
            }
            var r = results[0];
            var response = {
              ID: r.id,
              Timestamp: r.time,
              Cost: r.cost,
              Descriptions: r.description,
              IsCustomVenue: r.is_custom_venue,
              Lat: r.lat,
              Lon: r.lon,
            };
            if (response.IsCustomVenue) {
              response.Venue = r.venue;
            }
            callback(null, response, r.id);
          })
          .catch(function(err) {
            log.error(err);
            return ctrl.errorCallback(callback, 1,
                                      "Unknown error");
          });
      },

      // Add training responses
      function(response, trainingID, callback) {
        response.Responses = [];
        knex('team_training_responses').select(['training_id', 'user_id', 'response'])
          .where('training_id', trainingID)
          .then(function(results) {
            for(var ii = 0; ii < results.length; ++ii) {
              response.Responses.push({
                UserID: results[ii].user_id,
                Response: results[ii].response,
              });
            }
            response.Success = 0;
            response.Description = null;
            return callback(null, response);
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

module.exports = new GetTeamTrainingController();

