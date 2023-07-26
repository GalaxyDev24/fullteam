var knex = require('lib/knex');
var q = require('q');
var async = require('async');
var util = require('util');
var validator = require('node-validator');
var log = require('helpers/logger');

var Controller = require('controllers/controller');
var GeoService = require('services/geo-service');

function GetJoinedGamesController() {
  var ctrl = new Controller(this);
  this.getJoinedGames = function(packet) {
    var data = packet.data;
    var deferred = q.defer();
    var joinedGamesTransformerGenerator = function(gameInvites) {
      return function(result) {
        var gameData = {};

        gameData.GameID = result.GameID;
        gameData.GameTime = result.GameTime;
        gameData.GameTitle = result.GameTitle;
        gameData.Cost = result.Cost;
        gameData.Lat = result.Lat;
        gameData.Lon = result.Lon;
        gameData.Distance = result.Distance;
        gameData.IsCustomVenue = result.IsCustomVenue;
        gameData.PictureURL = result.PictureURL;
        gameData.Venue = result.Venue;
        gameData.IsTraining = result.IsTraining;
        gameData.GameType = result.GameType;
        gameData.TeamID = result.TeamID;
        gameData.TeamManagerID = result.TeamManagerID;
        gameData.TeamName = result.TeamName;

        gameData.GameInvites = gameInvites.filter(function(item) {
          return item.GameID === result.GameID;
        });

        return gameData;
      };
    };

    async.waterfall([
      function(callback) {
        knex('user_location')
          .select('lat', 'lon')
          .where('user_id', packet.userID)
          .then(function(results) {
            if (results.length == 0) {
              return ctrl.errorCallback(callback, 1,
                "Cannot find" + 
                "user location");
            }
            callback(null, results[0].lat, results[0].lon);
          })
          .catch(function(err) {
            console.log(err);
            return ctrl.errorCallback(callback, 1,
              "Unknown error");
          });
      },

      function(userLat, userLon, callback) {
        knex.select(['games.id', 'games.game_time', 'games.game_title',
          'games.cost', 'games.picture', 'games.team_id AS team_id',
          'games.lat', 'games.lon', 'games.is_custom_venue',
          'game_players.game_id', 'teams.manager_id', 'teams.name',
          'game_players.user_id', 'games.venue', 'games.is_training',
          'games.game_type'])
          .from('games')
          .innerJoin('game_players', 'game_players.game_id', 'games.id')
          .leftJoin('teams', 'teams.id', 'games.team_id')
          .where('game_players.user_id', packet.userID)
          .where('games.game_time', '>', (new Date()).getTime())
          .whereNull('teams.deleted_at')
          .then(function(results) {
            var response = [];
            for (var ii = 0; ii < results.length; ++ii) {
              var r = results[ii];
              var distance = GeoService.distance(userLat,
                userLon,
                r.lat,
                r.lon);
              var game = {
                GameID: r.id,
                GameTime:           r.game_time,
                GameTitle:          r.game_title,
                Cost:               r.cost,
                Distance:           distance,
                Lat:                r.lat,
                Lon:                r.lon,
                IsCustomVenue:      r.is_custom_venue,
                IsTraining:         r.is_training,
                GameType:           r.game_type,
                PictureURL:         r.picture,
                TeamID:             r.team_id,
                TeamManagerID:      r.manager_id,
                TeamName:           r.name,
              };
              if (r.is_custom_venue) {
                game.Venue = r.venue;
              }
              response.push(game);
            }

            return callback(null, response);
          })
          .catch(function(err) {
            console.log(err);
            return ctrl.errorCallback(callback, 1,
              "Unkown error");
          });
      },

      function(games, callback) {
        var gameIDs = games.map(function(result) {
          return result.GameID;
        });

        knex.select([
          'game_invites.game_id  as GameID',
          'game_invites.status as Status',
          'game_invites.user_id as UserID',
          knex.raw('CONCAT(reg_info.name, \' \', reg_info.last_name) AS UserFullName'),
          'reg_info.picture as PictureURL'
        ])
          .from('game_invites')
          .innerJoin('games', 'game_invites.game_id', 'games.id')
          .innerJoin('teams', 'games.team_id', 'teams.id')
          .innerJoin('reg_info', 'game_invites.user_id', 'reg_info.user_id')
          .whereIn('game_invites.game_id', gameIDs)
          .whereNull('teams.deleted_at')
          .orderByRaw('CASE WHEN game_invites.status = "available" THEN 1 WHEN game_invites.status IS NULL THEN 2 ELSE 3 END')
          .then(function(gameInvites) {
            return callback(null, games, gameInvites);
          })
          .catch(function(err) {
            console.log(err);
            return ctrl.errorCallback(callback, 1,
              "Unknown error");
          });
      },

      function(games, gameInvites, callback) {
        var response = games.map(joinedGamesTransformerGenerator(gameInvites));

        return callback(null, {
          success: 0,
          Description: null,
          Games: response
        });
      }
    ], ctrl.asyncCallback(deferred));
    return deferred.promise;
  }
}

module.exports = new GetJoinedGamesController();
