var knex = require('lib/knex');
var q = require('q');
var async = require('async');
var util = require('util');
var validator = require('node-validator');
var log = require('helpers/logger');
var config = require('config');
var suid = require('rand-token').suid;

var Controller = require('controllers/controller');
var ValidatorsService = require('services/validators')
var NotificationService = require('services/notification-service')
var firebase = require('helpers/firebase');

function CreateTeamGameController() {
  var ctrl = new Controller(this);

  this.createTeamGame = function(request, response, app) {
    var data = request.data;
    var deferred = q.defer();
    var teams = {};

    async.waterfall([
      function(callback) {
        var check = validator.isAnyObject()
            .withRequired('TeamID', validator.isInteger())
            .withRequired('GameTime', validator.isInteger())
            .withRequired('Description', validator.isString())
            .withRequired('IsCustomVenue', ValidatorsService.isBoolean)
            .withOptional('Venue', validator.isString())
            .withRequired('Lat', validator.isNumber())
            .withRequired('Lon', validator.isNumber())
            .withOptional('Cost', validator.isNumber({min:0}))
            .withOptional('IsTraining', ValidatorsService.isBoolean)
            .withOptional('PictureURL', validator.isString())
            .withOptional('Picture', validator.isString())
            .withOptional('CoverPictureURL', validator.isString())
            .withOptional('CoverPicture', validator.isString())
            .withOptional('PublishImmediatly', ValidatorsService.isBoolean)
            .withRequired('GameType', validator.isString());
        validator.run(check, data, function(errCount, errors) {
          if (!errCount) {
            return callback(null);
          }
          log.error(errors);
          return ctrl.errorCallback(callback, 1, "Invalid Parameters", errors);
        });
      },

      // Check if venue isn't custom the Venue key is there
      function(callback) {
        if (!data.IsCustomVenue && typeof data.Venue === 'undefined') {
          return ctrl.errorCallback(callback, 1, "Venue needs to be specfied if IsCustomVenue");
        }
        /*else {
          if (data.IsCustomVenue) {
            data.Venue = -1;
          }
          return callback(null);
        }*/

        return callback(null);
      },

      // Profile Picture
      function(callback) {

        if (typeof data.Picture === 'undefined') {
          return callback(null);
        }

        if (!data.Picture) {
          return callback(null);
        }

        var fs = require('fs');
        var img = data.Picture;
        var sanitizedImageData = img.replace(/^data:image\/\w+;base64,/, "");
        var buf = new Buffer(sanitizedImageData, 'base64');
        var filename = suid(32) + '.jpg';

        fs.writeFile('public/UserUploads/TeamPictures/' + filename, buf, function(err) {
          if (err) {
            return callback(err);
          }
          data.PictureURL = config.baseUrl + 'UserUploads/TeamPictures/' + filename;
          callback(null);
        });

      },

      // Cover Picture
      function(callback) {

        if (typeof data.CoverPicture === 'undefined') {
          return callback(null);
        }

        if (!data.CoverPicture) {
          return callback(null);
        }

        var fs = require('fs');
        var img = data.CoverPicture;
        var sanitizedImageData = img.replace(/^data:image\/\w+;base64,/, "");
        var buf = new Buffer(sanitizedImageData, 'base64');
        var filename = suid(32) + '.jpg';

        fs.writeFile('public/UserUploads/TeamPictures/' + filename, buf, function(err) {
          if (err) {
            return callback(err);
          }
          data.CoverPictureURL = config.baseUrl + 'UserUploads/TeamPictures/' + filename;
          callback(null);
        });

      },

      // Check that you are team manager
      function(callback) {
        knex('teams')
          .select()
          .where({id: data.TeamID})
          .then(function(results) {
            if (results.length === 0) {
              return ctrl.errorCallback(callback, 1, "TeamID does not exist");
            }

            if (results[0].manager_id !== request.userID) {
              return ctrl.errorCallback(callback, 2, "You are not the manager of this game");
            }

            teams.name = results[0].name;

            if (typeof data.PictureURL === 'undefined' || !data.PictureURL) {
              data.PictureURL = results.picture;
            }
            
            if (typeof data.CoverPictureURL === 'undefined' || !data.CoverPictureURL) {
              data.CoverPictureURL = results.cover_picture;
            }

            return callback(null);
          })
          .catch(function(err) {
            log.error(err);
            return ctrl.errorCallback(callback, 1, "Unknown error.");
          });
      },

      // Insert game data
      function (callback) {
        var insertData = {
          owner_id:          request.userID,
          is_custom_venue:   data.IsCustomVenue,
          venue:             data.Venue,
          public:            false,
          game_time:         data.GameTime,
          time_created:      (new Date()).getTime(),
          Description:       data.Description,
          lat:               data.Lat,
          lon:               data.Lon,
          cost:              data.Cost,
          is_team_game:      true,
          team_id:           data.TeamID,
          is_training:       data.GameType === 'Training',
          game_type:         data.GameType
        };

        if (data.PublishImmediatly) {
          insertData.is_published = data.PublishImmediatly;
        }

        if (typeof data.PictureURL !== 'undefined') {
          insertData.picture = data.PictureURL;
        }

        if (typeof data.CoverPictureURL !== 'undefined') {
          insertData.cover_picture = data.CoverPictureURL;
        }

        knex('games').insert(insertData, 'id')
          .then(function(results) {
            callback(null, results[0]);
          })
          .catch(function(err) {
            log.error(err);
            return ctrl.errorCallback(callback, 1, "Unknown error.");
          });
      },

      // Request manager details (for notification)
      function(gameID, callback) {
        knex('reg_info')
          .select(['name', 'last_name', 'picture', 'user_id'])
          .where({'user_id': request.userID})
          .then(function(results) {
            if (results.length == 0) {
              return ctrl.errorCallback(callback, 1,
                                        "Could not find reg info.");
            }
            callback(null, gameID, results[0].name, results[0].last_name, results[0].picture);
          })
          .catch(function(err) {
            log.error(err);
            return ctrl.errorCallback(callback, 1,
                                      "Unknown error.");
          });
      },

      // Find team player ids
      function(gameID, ownerFirstName, ownerLastName, ownerPictureURL, callback) {
        knex('team_players').select(['team_id', 'user_id'])
          .where('team_id', data.TeamID)
          .debug()
          .then(function(results) {
            var userIDs = [];
            for(var ii = 0; ii < results.length; ++ii) {
              // if (results[ii].user_id != request.userID) {
                userIDs.push(results[ii].user_id);
              // }
            }
            callback(null, gameID, ownerFirstName, ownerLastName, ownerPictureURL, userIDs);
          })
          .catch(function(err) {
            log.error(err);
            return ctrl.errorCallback(callback, 1,
                                      "Unknown error.");
          });
      },

      // Insert invites
      function(gameID, ownerFirstName, ownerLastName, ownerPictureURL, userIDs, callback) {
        var tasks = [];
        if (data.PublishImmediatly) {
          var currTime = (new Date()).getTime();
          userIDs.forEach(function(playerID){
            var task = q.defer();
            tasks.push(task);
            knex('game_invites')
              .insert({
                game_id: gameID,
                user_id: playerID,
                time: currTime
              })
              .then(function(results) {
                var notification = {
                  timestamp: (new Date()).getTime(),
                  type: NotificationService.notificationTypes.TEAM_GAME_INVITE,
                  data: JSON.stringify({
                    GameID: gameID,
                    OwnerID: request.userID,
                    OwnerFirstName: ownerFirstName,
                    OwnerLastName: ownerLastName,
                    OwnerPictureURL: ownerPictureURL,
                    GameType: data.GameType,
                    GameTime: data.GameTime,
                    IsCustomVenue: data.isCustomVenue,
                    Venue: data.Venue,
                    Latitude: data.Lat,
                    Longitude: data.Lon,
                    TeamName: teams.name
                  }),
                };

                Promise.all([
                  NotificationService.sendNotifications(
                    [playerID],
                    notification,
                    "You have received an invite to play in a game!",
                    app),
                ])
                  .then(function() {
                    task.resolve();
                  })
                  .catch(function(err) {
                    task.reject(err);
                  });
              })
              .catch(function(err) {
                task.reject(err);
              });
          });
        }

        Promise.all(tasks)
          .then(function() {
            callback(null, {
              success: 0,
              Description: null,
              GameID: gameID,
            });
          })
          .catch(function(err) {
            log.error(err);
            return ctrl.errorCallback(callback, 1,
                                      "Unknown error. #5");
          });
      },
    ], ctrl.asyncCallback(deferred));

    return deferred.promise;
  }

  return this;
}

module.exports = new CreateTeamGameController();


