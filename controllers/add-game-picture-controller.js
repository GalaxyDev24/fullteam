var knex = require('lib/knex');
var q = require('q');
var async = require('async');
var validator = require('node-validator');
var log = require('helpers/logger');
var suid = require('rand-token').suid;
var config = require('config');


var Controller = require('controllers/controller');
var NotificationService = require('services/notification-service');

function AddGamePictureController() {
  var ctrl = new Controller(this);
  this.addGamePicture = function(req, res, app) {
    var data = req.data;
    var deferred = q.defer();
    async.waterfall([
      // Validate params
      function(callback) {
        var check = validator.isAnyObject()
            .withRequired('GameID', validator.isInteger())
            .withRequired('Picture', validator.isString());
        validator.run(check, data, function(errCount, errors) {
          if (!errCount) {
            return callback(null);
          }
          log.error(errors);
          return ctrl.errorCallback(callback, 1,
                                    "Invalid Parameters");
        });
      },

      // Check you are the owner of the game
      function(callback) {
        knex('games').select(['owner_id', 'id']).where('id', data.GameID)
          .then(function(results) {
            if (results.length == 0) {
              console.log("HEY");
              return ctrl.errorCallback(callback, 1,
                                        "Game ID not found");
            }
            else if (results[0].owner_id != req.userID) {
              return ctrl.errorCallback(callback, 2,
                                        "You are not the owner of this game");
            }
            return callback(null);
          })
          .catch(function(err) {
            console.log(err);
            return ctrl.errorCallback(callback, 1,
                                      "Unknown error");
          });
      },

      // Create image...
      function(callback) {

        if (typeof data.Picture === 'undefined' || !data.Picture ) {
          return callback(null);
        }

        var fs                  = require('fs');
        var img                 = data.Picture;
        var sanitizedImageData  = img.replace(/^data:image\/\w+;base64,/, "");
        var buf                 = new Buffer(sanitizedImageData, 'base64');
        var filename            = suid(32) + '.jpg';

        fs.writeFile('public/UserUploads/GamePictures/' + filename, buf, function(err) {
          
          if(err) {
            return callback(err);
          }

          var url = config.baseUrl + 'UserUploads/GamePictures/' + filename;
          callback(null, url);

        });
      },

      // Add image URL to db
      function(url, callback) {
        knex('games').update('picture', url).where('id', data.GameID)
          .then(function() {
            callback(null, {
              Success: 0,
              Description: null
            });
          })
          .catch(function(err) {
            return ctrl.errorCallback(callback, 1,
                                      "Unknown error");
          });
      }

    ], ctrl.asyncCallback(deferred));
    return deferred.promise;
  };
  return this;
}

module.exports = new AddGamePictureController();
