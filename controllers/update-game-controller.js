var knex = require('lib/knex');
var q = require('q');
var async = require('async');
var validator = require('node-validator');
var ValidatorsService = require('services/validators');
var log = require('helpers/logger');

var Controller = require('controllers/controller');

function UpdateGameController() {
  var ctrl = new Controller(this);
  this.updateGame = function(request, response, app) {
    var data = request.data;
    var deferred = q.defer();

    async.waterfall([

      // Validate params
      function(callback) {
        var check = validator.isAnyObject()
            .withRequired('GameID', validator.isInteger())
            .withOptional('IsPublished', ValidatorsService.isBoolean)
            .withOptional('TeamID', validator.isInteger())
            .withOptional('GameTime', validator.isInteger())
            .withOptional('Venue', validator.isString())
            .withOptional('Cost', validator.isNumber({min:0}))
            .withOptional('GameType', validator.isString())
            .withOptional('PictureURL', validator.isString())
            .withOptional('CoverPictureURL', validator.isString());
        validator.run(check, data, function(errCount, errors) {
          if (!errCount) {
            return callback(null);
          }
          log.error(errors);
          return ctrl.errorCallback(callback, 1,
                                    "Invalid Parameters");
        });
      },

      // Update game profile picture
      function (callback) {

        if (typeof data.PictureURL === 'undefined') {
          return callback(null);
        }

        if (!data.PictureURL) {
          return callback(null);
        }

        var fs                  = require('fs');
        var img                 = data.PictureURL;
        var sanitizedImageData  = img.replace(/^data:image\/\w+;base64,/, "");
        var buf                 = new Buffer(sanitizedImageData, 'base64');
        var filename            = suid(32) + '.jpg';

        fs.writeFile('public/UserUploads/TeamPictures/' + filename, buf, function(err) {
            if(err) {
                return callback(err);
            }
            data.PictureURL = config.baseUrl + 'UserUploads/TeamPictures/' + filename;
            return callback(null);
        });

      },

      // Update game cover picture
      function (callback) {

        if (typeof data.CoverPictureURL === 'undefined') {
          return callback(null);
        }

        if (!data.CoverPictureURL) {
          return callback(null);
        }

        var fs                  = require('fs');
        var img                 = data.CoverPictureURL;
        var sanitizedImageData  = img.replace(/^data:image\/\w+;base64,/, "");
        var buf                 = new Buffer(sanitizedImageData, 'base64');
        var filename            = suid(32) + '.jpg';

        fs.writeFile('public/UserUploads/TeamPictures/' + filename, buf, function(err) {
            if(err) {
                return callback(err);
            }
            data.CoverPictureURL = config.baseUrl + 'UserUploads/TeamPictures/' + filename;
            return callback(null);
        });

      },

      // Check that this user is part of the team
      function(callback) {
        knex('games').select('owner_id')
          .where('id', data.GameID)
          .then(function(results) {

            if (results.length == 0) {
              return ctrl.errorCallback(callback, 1, "Game doesn\'t exist");
            }

            if (results[0].owner_id != request.userID) {
              return ctrl.errorCallback(callback, 2, "You are not the owner of this team");
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
        var updatedGameInfo = {};

        if (data.IsPublished) {
          updatedGameInfo.is_published = data.IsPublished;
        }

        if (data.TeamID) {
          updatedGameInfo.team_id = data.TeamID;
        }

        if (data.GameTime) {
          updatedGameInfo.game_time = data.GameTime;
        }

        if (data.Venue) {
          updatedGameInfo.venue = data.Venue;
        }

        if (data.Cost) {
          updatedGameInfo.cost = data.Cost;
        }

        if (data.PictureURL) {
          updatedGameInfo.picture = data.PictureURL;
        }

        if (data.CoverPictureURL) {
          updatedGameInfo.cover_picture = data.CoverPictureURL;
        }

        if (data.GameType) {
          updatedGameInfo.is_training = data.GameType === 'Training';
          updatedGameInfo.game_type = data.GameType;
        }

        knex('games')
          .where('id', data.GameID)
          .update(updatedGameInfo)
          .then(function(results) {
            var response = {};
            return callback(null, response);
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

module.exports = new UpdateGameController();
