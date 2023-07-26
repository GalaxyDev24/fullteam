let knex = require('lib/knex');
let q = require('q');
let async = require('async');
let util = require('util');
let validator = require('node-validator');
let log = require('helpers/logger');

let Controller = require('controllers/controller');
let ValidatorsService = require('services/validators');
let GeoService = require('services/geo-service');

function SearchGameController() {
  let ctrl = new Controller(this);

  this.searchGames = function(packet) {
    let data = packet.data;
    let deferred = q.defer();

    let additionalDataTransformerGenerator = function() {
      return function(item) {
        return {
          UserID: item.UserID,
          Status: item.Status,
          FirstName: item.FirstName,
          LastName: item.LastName,
          PictureURL: item.PictureURL,
        };
      };
    }

    let teamGamesTransformerGenerator = function(currentUserID, gameInvites) {
      return function(result) {
        let gameData = {};


        gameData.UserID         =     result.UserID;
        gameData.FirstName      =     result.FirstName; 
        gameData.LastName       =     result.LastName; 
        gameData.PictureURL     =     result.PictureURL; 
        gameData.GameID         =     result.GameID; 
        gameData.Description    =     result.Description; 
        gameData.GameTime       =     result.GameTime; 
        gameData.GameTitle      =     result.GameTitle; 
        gameData.TimeCreated    =     result.TimeCreated; 
        gameData.Distance       =     result.Distance;
        gameData.Lat            =     result.Lat; 
        gameData.Lon            =     result.Lon; 
        gameData.IsCustomVenue  =     result.IsCustomVenue; 
        gameData.Cost           =     result.Cost;

        if (!result.IsCustomVenue) {
          gameData.Venue = result.Venue;
        }


        gameData.GameInvites = gameInvites.filter(function(item) {
          return item.GameID === result.GameID;
        }).map(additionalDataTransformerGenerator());

        console.log('gameInvites');
        console.log(gameInvites);
        console.log(gameData);

        return gameData;
      };
    };

    async.waterfall([
      function(callback) {
        let check = validator.isAnyObject()
          .withRequired('SearchDistance', validator.isInteger({min: 0}));
        validator.run(check, data, function(errCount, errors) {
          if (!errCount) {
            return callback(null);
          }
          log.error(errors);
          return ctrl.errorCallback(callback, 1, "Invalid Parameters");
        });
      },

      function(callback) {
        knex('user_location').where({user_id: packet.userID})
          .then(function(userLocResults) {
            if (userLocResults.length == 0) {
              return ctrl.errorCallback(callback, 1,
                "User location cannot be found.");
            }
            knex.select([
              'reg_info.user_id', 
              'reg_info.name',
              'reg_info.last_name', 'reg_info.picture',
              'games.lat', 'games.lon', 'games.id',
              'games.venue',
              'games.game_time', 
              'games.game_title',
              'games.time_created', 
              'games.Description',
              'games.is_custom_venue',
              'games.cost', ])
              .from('games')
              .leftJoin('teams', 'teams.id', 'games.team_id')
              .leftJoin('reg_info', 'reg_info.user_id', 'games.owner_id')
              .where(function() {
                this.where('reg_info.user_id', '<>', packet.userID)
                  .andWhere('games.public', '=', '1')
                  .whereNull('teams.deleted_at');
              }).andWhere('games.game_time', '>', (new Date()).getTime())
              .then(function(results) {
                var games = [];
                for (var ii = 0; ii < results.length; ++ii) {
                  var json = results[ii];
                  var lat = json.lat;
                  var lon = json.lon;
                  var distance =
                    GeoService.distance(userLocResults[0].lat,
                      userLocResults[0].lon,
                      lat, lon);
                  var game = {
                    UserID:            json.user_id,
                    FirstName:         json.name,
                    LastName:          json.last_name,
                    PictureURL:        json.picture,
                    GameID:            json.id,
                    Description:       json.Description,
                    GameTime:          json.game_time,
                    GameTitle:         json.game_title,
                    TimeCreated:       json.time_created,
                    Distance:          distance,
                    Lat:               json.lat,
                    Lon:               json.lon,
                    IsCustomVenue:     json.is_custom_venue,
                    Cost:              json.cost,
                  };
                  if (!game.IsCustomVenue) {
                    game.Venue = json.venue;
                  }
                  games.push(game);
                }
                return callback(null, games);
              },
                function(err) {
                  log.error(err)
                  return ctrl.errorCallback(callback, 1,
                    "An unkown error has " +
                    "occurred");
                });
          }, function(err) {
            log.error(err)
            return ctrl.errorCallback(callback, 1,
              "An unkown error has occurred");
          })
      },

      // Return game invites info
      function(games, callback) {
        var gameIDs = games.map(function(result) {
          return result.GameID;
        });

        knex('game_invites').select([
          'game_invites.game_id as GameID',
          'game_invites.user_id as UserID',
          'game_invites.status as Status',
          'reg_info.name as FirstName',
          'reg_info.last_name as LastName',
          'reg_info.picture as PictureURL',
        ])
          .leftJoin('reg_info', 'game_invites.user_id', 'reg_info.user_id')
          .whereIn('game_id', gameIDs)
          .orderByRaw('CASE WHEN game_invites.status = "available" THEN 1 WHEN game_invites.status IS NULL THEN 2 ELSE 3 END')
          .then(function(gameInvites) {
            return callback(null, games, gameInvites);
          })
          .catch(function(err) {
            log.error(err);
            return ctrl.errorCallback(callback, 1,
              "Unknown error");
          });
      },

      function(games, gameInvites, callback) {
        var gameData = games.map(teamGamesTransformerGenerator(packet.userID, gameInvites));

        return callback(null, {
          Games: gameData
        });
      },

    ], ctrl.asyncCallback(deferred));
    return deferred.promise;
  }

  return this;
}

module.exports = new SearchGameController();
