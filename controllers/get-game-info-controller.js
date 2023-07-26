var knex = require('lib/knex');
var q = require('q');
var async = require('async');
var util = require('util');
var validator = require('node-validator');
var log = require('helpers/logger');

var Controller = require('controllers/controller');
var ValidatorsService = require('services/validators');
var GeoService = require('services/geo-service');

function GetGameInfoController(){
  var ctrl = new Controller(this);

  this.getGameInfo = function(packet) {
    var data = packet.data;
    var deferred = q.defer();

    async.waterfall([
      // Validate params
      function(callback) {
        var check = validator.isAnyObject()
          .withRequired('GameID', validator.isInteger());
        validator.run(check, data, function(errCount, errors) {
          if (!errCount) {
            return callback(null);
          }
          log.error(errors);
          return ctrl.errorCallback(callback, 1, "Invalid Parameters");
        });
      },

      // Find user loc
      function(callback) {
        knex('user_location').where({user_id: packet.userID})
          .then(function(results) {
            if (results.length == 0) {
              return ctrl.errorCallback(callback, 1, "Can't find user location");
            }
            else {
              callback(null, results[0].lat, results[0].lon);
            }
          });
      },

      // Find available / unsure / unavailable
      function(userLat, userLon, callback) {
        knex('game_invites').select(['status', 'name', 'last_name', 'picture', 'reg_info.user_id'])
          .where("game_id", data.GameID)
          .leftJoin('reg_info', 'reg_info.user_id', 'game_invites.user_id')
          .then(function(res) {
            let available = [];
            let unavailable = [];
            let unsure = [];
            for (let ii = 0; ii < res.length; ++ii) {
              if (res[ii].status) {
                if (res[ii].status === 'unavailable') {
                  unavailable.push({
                    UserID: res[ii].user_id,
                    FirstName: res[ii].name,
                    LastName: res[ii].last_name,
                    PictureURL: res[ii].picture,
                  });
                }
                else if (res[ii].status === 'available') {
                  available.push({
                    UserID: res[ii].user_id,
                    FirstName: res[ii].name,
                    LastName: res[ii].last_name,
                    PictureURL: res[ii].picture,
                  });
                }
              }
              else {
                unsure.push({
                  UserID: res[ii].user_id,
                  FirstName: res[ii].name,
                  LastName: res[ii].last_name,
                  PictureURL: res[ii].picture,
                });
              }
            }
            callback(null, userLat, userLon, available, unsure, unavailable);
          })
          .catch(function(err) {
            return ctrl.errorCallback(callback, 1,
              "Unknown server error fetching game invite status.");
          });
      },

      function(userLat, userLon, available, unsure, unavailable, callback) {
        knex.select(['owner_id', 'games.id', 'name',
          'opponent', 'game_title',
          'last_name', 'reg_info.picture', 'lat', 'lon',
          'game_time', 'time_created', 'description',
          'is_custom_venue', 'venue', 'cost',
          'is_training', 'game_type'])
          .from('games')
          .leftJoin('reg_info',
            'reg_info.user_id',
            'games.owner_id')
          .where({id: data.GameID})
          .then(function(results) {
            if (results.length == 0) {
              return ctrl.errorCallback(callback, 10,
                "Game doesn't exist");
            }
            var r = results[0];
            distance = GeoService.distance(userLat, userLon, r.lat, r.lon);
            var response = {
              success: 0,
              UserID: r.owner_id,
              FirstName: r.name,
              LastName: r.last_name,
              PictureURL: r.picture,
              GameID: data.GameID,
              Latitude: r.lat,
              Longitude: r.lon,
              GameTime: r.game_time,
              TimeCreated: r.time_created,
              Distance: distance,
              Description: r.description,
              IsCustomVenue: r.is_custom_venue,
              Available: available,
              Unsure: unsure,
              Unavailable: unavailable,
              Cost: r.cost,
              IsTraining: r.is_training,
              GameType: r.game_type,
              GameTitle: r.game_title,
              Opponent: r.opponent,
            };
            if (response.IsCustomVenue) {
              response.Venue = r.venue;
            }
            callback(null, response);
          })
          .catch(function(err) {
            log.error(err);
            return ctrl.errorCallback(callback, 1,
              "Unknown Error");
          });
      }
    ], ctrl.asyncCallback(deferred));

    return deferred.promise;
  };

  return this;
};

module.exports = new GetGameInfoController();

