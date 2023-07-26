var knex = require('lib/knex');
var q = require('q');
var async = require('async');
var util = require('util');
var validator = require('node-validator');
var log = require('helpers/logger');

var Controller = require('controllers/controller');

function GetGameInvitesReceivedController() {
  var ctrl = new Controller(this);

  this.getGameInvitesReceived = function(packet) {
    var data = packet.data;
    var deferred = q.defer();
    async.waterfall([
      function(callback) {
        knex.select(['game_invites.user_id', 'game_id', 'owner_id', 'time',
          'venue', 'is_custom_venue', 'games.lat', 'games.lon',
          'reg_info.picture', 'reg_info.name', 'reg_info.last_name'])
          .from('game_invites')
          .leftJoin('games', 'games.id', 'game_id')
          .leftJoin('reg_info', 'reg_info.user_id', 'owner_id')
          .where('game_invites.user_id', packet.userID)
          .then(function(results) {
            var response = [];
            for(var ii = 0; ii < results.length; ++ii) {
              var r = results[ii];
              response.push({
                FromID: r.owner_id,
                FromFirstName: r.name,
                FromLastName: r.last_name,
                GameID: r.game_id,
                Time: r.time,
                IsCustomVenue: r.is_custom_venue,
                Latitude: r.lat,
                Longitude: r.lon,
                PictureURL: r.picture,
              });
              if (r.is_custom_venue) {
                response.Venue = r.venue;
              }
            }
            return callback(null, {
              success: 0,
              Description: null,
              InviteList: response
            });
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
};

module.exports = new GetGameInvitesReceivedController();
