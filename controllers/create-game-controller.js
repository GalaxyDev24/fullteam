var knex = require('lib/knex');
var q = require('q');
var async = require('async');
var util = require('util');
var validator = require('node-validator');
var validate = require("validate.js");
var log = require('helpers/logger');

var Controller = require('controllers/controller');
var ValidatorsService = require('services/validators');

var createGameRequestConstraints = {
  GameTitle: {
    presence: {
      message: "is required"
    }
  },
  Opponent: {
    presence: {
      message: "is required"
    }
  },
  GameTime: {
    presence: {
      message: "is required"
    },
    numericality: {
      onlyInteger: true
    }
  },
  Description: {
    presence: {
      message: "is required"
    }
  },
  IsCustomVenue: {
    presence: {
      message: "is required"
    }
  },
  Lat: {
    presence: {
      message: "is required"
    },
    numericality: true
  },
  Lon: {
    presence: {
      message: "is required"
    },
    numericality: true
  },
  Public: {
    presence: {
      message: "is required"
    }
  },
  Cost: {
    presence: {
      message: "is required"
    },
    numericality: {
      onlyInteger: true
    }
  }
};

function CreateGameController() {
  var ctrl = new Controller(this);

  this.createGame = function(packet) {
    var data = packet.data;
    var deferred = q.defer();

    async.waterfall([
      function(callback) {
        var errors = validate(data, createGameRequestConstraints);
        if (errors) {
          return ctrl.errorCallback(callback, 1, "Invalid Parameters", errors);
        }

        if (typeof data.Venue === 'undefined' || data.Venue == null) {
          data.Venue = '';
        }
        return callback(null);
      },

      // Get picture URL
      function (callback) {
        knex('reg_info').select(['picture']).where('user_id', packet.userID)
          .then(function(res) {
            if (res.length == 0) {
              log.error('Tried to select game owner\'s picture, but user not found in DB');
              return ctrl.errorCallback(callback, 1, "An unknown server error has occurred");
            }
            else {
              return callback(null, res[0].picture);
            }
          })
          .catch(function(err) {
            log.error(err);
            return ctrl.errorCallback(callback, 1, "An unknown server error has occurred");
          });
      },

      // Insert game data
      function (pictureURL, callback) {
        knex('games').insert({
          owner_id:          packet.userID,
          game_title:        data.GameTitle,
          opponent:          data.Opponent,
          is_custom_venue:   data.IsCustomVenue,
          venue:             data.Venue,
          public:            data.Public,
          game_time:         data.GameTime,
          time_created:      (new Date()).getTime(),
          description:       data.Description,
          lat:               data.Lat,
          lon:               data.Lon,
          picture:           pictureURL,
          cost:              data.Cost,
        }, 'id').then(
          function(results) {
            callback(null, {'success': 0, 'Description': null, 'GameID': results[0]});
          },
          function(error) {
            log.error(error);
            callback({'success': 1,
              'Description': 'An unknown server error '
              + 'has occurred'});
          });
      }
    ], ctrl.asyncCallback(deferred));

    return deferred.promise;
  }

  return this;
}

module.exports = new CreateGameController();


