var knex = require('lib/knex');
var q = require('q');
var async = require('async');
var validator = require('node-validator');
var log = require('helpers/logger');

var Controller = require('controllers/controller');
var NotificationService = require('services/notification-service');
var GeoService = require('services/geo-service');

function GetUnpublishedGameController() {
  var ctrl = new Controller(this);
  this.getUnpublishedGame = function(request, response, app) {
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

      // Check that this user is part of the team
      function(callback) {
        knex('teams').select('manager_id')
          .where('id', data.TeamID)
          .whereNull('deleted_at')
          .then(function(results) {

            if (results.length == 0) {
              return ctrl.errorCallback(callback, 1, "Team doesn\'t exist");
            }

            if (results[0].manager_id != request.userID) {
              return ctrl.errorCallback(callback, 2, "You are not the manager of this team");
            }
            
            return callback(null);
          })
          .catch(function(err) {
            log.error(err);
            return ctrl.errorCallback(callback, 1, "Unknown error");
          });
      },

      // Return game info
      function(callback) {
        knex('games').select([
          'id', 
          'lat', 
          'lon', 
          'game_time',
          'game_type',
          'time_created', 
          'description',
          'is_custom_venue', 
          'venue', 
          'team_id', 
          'cost',])
          .where('owner_id', request.userID)
          .andWhere('team_id', data.TeamID)
          .andWhere('is_team_game', true)
          .andWhere('is_published', false)
          .orderBy('time_created', 'desc')
          .first()
          .then(function(results) {

            var response = {};

            if (!results) {
              response.Game = {};
              return callback(null, response);
            }

            var r = results;
            if (r.game_time < (new Date()).getTime()) {
              response.Game = {};
              return callback(null, response);
            }

            var gameData = {
              GameID: r.id,
              Latitude: r.lat,
              Longitude: r.lon,
              GameTime: r.game_time,
              GameType: r.game_type,
              TimeCreated: r.time_created,
              Description: r.description,
              IsCustomVenue: r.is_custom_venue,
              Cost: r.cost,
              Venue: r.venue
            };

            response.Game = gameData;

            callback(null, response);
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

module.exports = new GetUnpublishedGameController();
