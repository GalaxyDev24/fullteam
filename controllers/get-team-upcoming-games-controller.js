var knex = require('lib/knex');
var q = require('q');
var async = require('async');
var validator = require('node-validator');
var log = require('helpers/logger');

var Controller = require('controllers/controller');
var GeoService = require('services/geo-service');
var ValidatorsService = require('services/validators')

function GetTeamUpcomingGamesController() {
  var ctrl = new Controller(this);
  this.getTeamUpcomingGames = function(request, response, app) {
    var data = request.data;
    var deferred = q.defer();
    var response = {};

    var teamGamesTransformerGenerator = function(currentUserID, playerPositions, gameInvites) {
      return function(result) {
        var gameData = {};

        gameData.GameID = result.GameID;
        gameData.Latitude = result.Latitude;
        gameData.Longitude = result.Longitude;
        gameData.GameTime = result.GameTime;
        gameData.TimeCreated = result.TimeCreated;
        gameData.Distance = result.Distance;
        gameData.Description = result.Description;
        gameData.IsCustomVenue = result.IsCustomVenue;
        gameData.Venue = result.IsCustomVenue ? result.Venue: '';
        gameData.Cost = result.Cost;
        gameData.PictureURL = result.PictureURL;
        gameData.GameType = result.GameType;
        gameData.TeamID = result.TeamID;
        gameData.TeamManagerID = result.TeamManagerID;
        gameData.TeamName = result.TeamName;

        gameData.PlayerPositions = playerPositions.filter(function(item) {
          return item.GameID === result.GameID;
        });

        gameData.GameInvites = gameInvites.filter(function(item) {
          return item.GameID === result.GameID;
        });

        return gameData;
      };
    };

    async.waterfall([

      // Validate params
      function(callback) {
        var check = validator.isAnyObject()
            .withRequired('TeamID', validator.isInteger())
            .withRequired('IsTraining', ValidatorsService.isBoolean);
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
                                        "Team no longer exist");
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
        var timeNow = (new Date()).getTime();
        
        knex('games').select([
          'games.id', 
          'games.lat', 
          'games.lon', 
          'games.game_time', 
          'games.game_type',
          'games.time_created', 
          'games.description',
          'games.is_custom_venue', 
          'games.venue', 
          'games.team_id', 
          'games.cost', 
          'games.picture', 
          'teams.manager_id',
          'teams.name'
          ])
          .innerJoin('teams', 'games.team_id', 'teams.id')
          .where('team_id', data.TeamID)
          .andWhere('is_team_game', true)
          .andWhere('is_training', data.IsTraining === true)
          .andWhere('game_time', '>', timeNow)
          .orderBy('game_time', 'asc')
          .then(function(results) {
            if (results.length === 0) {
              return ctrl.errorCallback(callback, 3,
                                        "No team game found");
            }

            var games = [];
            for (var i = 0; i < results.length; i++) {
              var r = results[i];
              if (r.game_time < (new Date()).getTime()) {
                continue;
              }

              var distance = GeoService.distance(userLat, userLon, r.lat, r.lon);
              var gameData = {
                GameID: r.id,
                Latitude: r.lat,
                Longitude: r.lon,
                GameTime: r.game_time,
                TimeCreated: r.time_created,
                Distance: distance,
                Description: r.description,
                IsCustomVenue: r.is_custom_venue,
                Cost: r.cost,
                PictureURL: r.picture,
                GameType: r.game_type,
                TeamID: r.team_id,
                TeamManagerID: r.manager_id,
                TeamName: r.name
              };

              if (r.is_custom_venue) {
                gameData.Venue = r.venue;
              }

              games.push(gameData);
            }

            return callback(null, games);
          })
          .catch(function(err) {
            log.error(err);
            return ctrl.errorCallback(callback, 1,
                                      "Unknown error");
          });
      },

      // Select user positions
      function(games, callback) {
        
        var gameIDs = games.map(function(result) {
          return result.GameID;
        });

        knex('game_players').select('game_id', 'user_id', 'position')
          .whereIn('game_id', gameIDs)
          .then(function(results) {
            var playerPositions = [];

            for(var ii = 0; ii < results.length; ii++) {
              playerPositions.push({
                GameID: results[ii].game_id,
                UserID: results[ii].user_id,
                Position: results[ii].position,
              });
            }

            return callback(null, games, playerPositions);
          }, function(err) {
            log.error(err);
            return ctrl.errorCallback(callback, 1,
                                      "Unknown error");
          });
      },

      // Return game invites info
      function(games, playerPositions, callback) {
        var gameIDs = games.map(function(result) {
          return result.GameID;
        });

        knex('game_invites').select([
          'game_invites.game_id as GameID',
          'game_invites.user_id as UserID',
          'game_invites.time as Time', 
          'game_invites.status as Status',
          knex.raw('CONCAT(reg_info.name, \' \', reg_info.last_name) AS UserFullName'),
          'reg_info.picture as PictureURL'
          ])
          .innerJoin('reg_info', 'game_invites.user_id', 'reg_info.user_id')
          .whereIn('game_id', gameIDs)
          .orderByRaw('CASE WHEN game_invites.status = "available" THEN 1 WHEN game_invites.status IS NULL THEN 2 ELSE 3 END')
          .then(function(gameInvites) {
            return callback(null, games, playerPositions, gameInvites);
          })
          .catch(function(err) {
            log.error(err);
            return ctrl.errorCallback(callback, 1,
                                      "Unknown error");
          });
      },

      function(games, playerPositions, gameInvites, callback) {
        var gameData = games.map(teamGamesTransformerGenerator(request.userID, playerPositions, gameInvites));

        // console.log(util.inspect(posts, {depth: 4}));
        response.Success = 0;
        response.Description = null;
        response.GameData = gameData;

        return callback(null, response);
      },

    ], ctrl.asyncCallback(deferred));
    return deferred.promise;
  };

  return this;
}

module.exports = new GetTeamUpcomingGamesController();
