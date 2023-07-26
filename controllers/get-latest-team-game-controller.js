var knex = require('lib/knex');
var q = require('q');
var async = require('async');
var validator = require('node-validator');
var log = require('helpers/logger');

var Controller = require('controllers/controller');
var NotificationService = require('services/notification-service');
var GeoService = require('services/geo-service');

function GetLatestTeamGameController() {
  var ctrl = new Controller(this);
  this.getLatestTeamGame = function(request, response, app) {
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
              return ctrl.errorCallback(callback, 1,
                                        "Team doesn\'t exist");
            }
            if (results[0].manager_id == request.userID) {
              return callback(null);
            }
            knex('team_players').select(['team_id', 'user_id'])
              .where({'user_id': request.userID,
                      'team_id': data.TeamID})
              .then(function(results) {
                if (results.length == 0) {
                  return ctrl.errorCallback(callback, 2,
                                            "You are not part of this team.");
                }
                return callback(null);
              });
          })
          .catch(function(err) {
            log.error(err);
            return ctrl.errorCallback(callback, 1,
                                      "Unknown error");
          });
      },

      // Select this user's location
      function(callback) {
        knex('user_location').select(['lat', 'lon', 'user_id'])
          .where('user_id', request.userID)
          .then(function(results) {
            if (results.length == 0) {
              return ctrl.errorCallback(callback, 1,
                                        "User location not found");
            }
            return callback(null, results[0].lat, results[0].lon);
          })
          .catch(function(err) {
            log.error(err);
            return ctrl.errorCallback(callback, 1,
                                      "Unknown error");
          });
      },

      // Return game info
      function(userLat, userLon, callback) {
        knex('games').select([
          'id', 'lat', 'lon', 'game_time', 'time_created', 'description',
          'is_custom_venue', 'venue', 'team_id', 'cost', 'is_training', 'game_type'])
          .where('team_id', data.TeamID)
          .andWhere('is_team_game', true)
          .andWhere('is_training', false)
          .orderBy('time_created', 'desc')
          .then(function(results) {
            if (results.length == 0) {
              return ctrl.errorCallback(callback, 3,
                                        "No team game found");
            }
            var r = results[0];
            if (r.game_time < (new Date()).getTime()) {
              return ctrl.errorCallback(callback, 3,
                                        "No team game found");
            }
            // Calculate distance to game
            var distance = GeoService.distance(userLat, userLon, r.lat, r.lon);
            var gameData = {
              GameID: r.id,
              Latitude: r.lat,
              Longitude: r.lon,
              HasTransport: r.transport,
              GameTime: r.game_time,
              TimeCreated: r.time_created,
              Distance: distance,
              MeetingPlace: r.meeting_place,
              Description: r.description,
              IsCustomVenue: r.is_custom_venue,
              SurfaceType: r.surface_type,
              AvgAbility: r.average_ability,
              AvgAge: r.average_age,
              Cost: r.cost,
              ShinPads: r.shin_pads,
              IsTraining: r.is_training,
              GameType: r.game_type,
            };
            if (r.is_custom_venue) {
              gameData.Venue = r.venue;
            }
            callback(null, gameData);
          })
          .catch(function(err) {
            log.error(err);
            return ctrl.errorCallback(callback, 1,
                                      "Unknown error");
          });
      },

      // Select user positions
      function(gameData, callback) {
        knex('game_players').select('game_id', 'user_id', 'position')
          .where('game_id', gameData.GameID)
          .then(function(results) {
            var playerPositions = [];
            for(var ii = 0; ii < results.length; ++ii) {
              playerPositions.push({
                UserID: results[0].user_id,
                Position: results[0].position,
              });
            }
            gameData.Success = 0;
            gameData.Description = null;
            gameData.PlayerPositions = playerPositions;
            return callback(null, gameData);
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

module.exports = new GetLatestTeamGameController();
