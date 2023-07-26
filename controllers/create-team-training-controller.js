var knex = require('lib/knex');
var q = require('q');
var async = require('async');
var validator = require('node-validator');
var log = require('helpers/logger');

var Controller = require('controllers/controller');
var TeamTrainingService = require('services/team-training-service');
var ValidatorsService = require('services/validators')

function CreateTeamTrainingController() {
  var ctrl = new Controller(this);
  this.createTeamTraining = function(request, response, app) {
    var data = request.data;
    var deferred = q.defer();

    async.waterfall([
      // Validate params
      function(callback) {
        var check = validator.isAnyObject()
          .withRequired('TeamID', validator.isInteger())
          .withRequired('GameTime', validator.isInteger())
          .withOptional('Cost', validator.isNumber({min:0}))
          .withRequired('Description', validator.isString())
          .withRequired('IsCustomVenue', ValidatorsService.isBoolean)
          .withOptional('Venue', validator.isString())
          .withRequired('Lat', validator.isNumber())
          .withRequired('Lon', validator.isNumber())
          .withRequired('GameType', validator.isNumber({min:3, max: 3}));
        validator.run(check, data, function(errCount, errors) {
          if (!errCount) {
            return callback(null);
          }
          log.error(errors);
          return ctrl.errorCallback(callback, 1,
            "Invalid Parameters");
        });
      },

      // Check you are team manager
      function(callback) {
        knex('teams').select(['id', 'manager_id'])
          .where({
            id: data.TeamID,
            manager_id: request.userID
          })
          .then(function(results) {
            if (results.length == 0) {
              return ctrl.errorCallback(callback, 2, "Need to be manager to do that");
            }
            return callback(null);
          })
          .catch(function(err) {
            return ctrl.errorCallback(callback, 1, "Unknown error");
          });
      },

      // Select team players
      function(callback) {
        knex('team_players').select(['team_id', 'user_id'])
          .where('team_id', data.TeamID)
          .then(function(results) {
            var userIDs = [];
            for(var ii = 0; ii < results.length; ++ii) {
              userIDs.push(results[ii].user_id);
            }
            callback(null, userIDs);
          })
          .catch(function(err) {
            return ctrl.errorCallback(callback, 1, "Unknown error");
          });
      },

      // Add training to DB
      function(userIDs, callback) {
        knex.transaction(function(trx) {
          var insertData = {
            team_id: data.TeamID,
            game_time: data.GameTime,
            description: data.Description,
            cost: data.Cost,
            is_custom_venue: data.IsCustomVenue,
            lat: data.Lat,
            lon: data.Lon,
            is_team_game: true,
            owner_id: request.userID,
            is_training: true,
            game_type: data.GameType,
            public: false,
            time_created: (new Date()).getTime(),
            description: "",
          };
          if (data.IsCustomVenue && data.hasOwnProperty('Venue')) {
            insertData.venue = data.Venue;
          }
          else if (data.IsCustomVenue) {
            trx.rollback();
            return ctrl.errorCallback(callback, 3, "IsCustomVenue set, but not venue provided");
          }
          knex('games').returning('id')
            .transacting(trx)
            .insert(insertData)
            .then(function(id) {
              callback(null, trx, id, userIDs);
            })
            .catch(function(err) {
              trx.rollback();
              throw err;
            });
        })
          .catch(function(err) {
            // This seems to always get called with err = undefined
            // for some reason, but everything passes and the database
            // state is at what it should be after the test...???
            if (typeof err !== 'undefined') {
              log.error(err);
              ctrl.errorCallback(callback, 1, "Unknown error");
            }
          });
      },

      // Add training responses to DB
      function(trx, trainingID, userIDs, callback) {
        var tasks = [];
        for(var ii = 0; ii < userIDs.length; ++ii) {
          var task = knex('team_training_responses')
            .transacting(trx)
            .insert({
              training_id: trainingID,
              user_id: userIDs[ii]
            })
            .catch(function(err) {
              log.error(err);
            });
          tasks.push(task);

          Promise.all(tasks)
            .then(function() {
              trx.commit();
              callback(null, trainingID, userIDs);
            })
            .catch(function(err) {
              trx.rollback();
              log.error(err);
              ctrl.errorCallback(callback, 1, "Unknown error");
            });
        }
      },

      // Send team training notifs
      function(trainingID, userIDs, callback) {
        // Select team name and picture
        knex('teams').select(['picture', 'name'])
          .where('id', data.TeamID)
          .then(function(results) {
            if (results.length == 0) {
              log.error("Unknown error, team data not found");
              ctrl.errorCallback(callback, 1, "Unknown error");
            }
            var teamName = results[0].name;
            var pictureURL = results[0].picture;
            var notifMessage = teamName + 
              " are checking if you're coming to to training at "
              data.Venue;
            TeamTrainingService.sendTrainingNotif(app, userIDs, data.TeamID, teamName, pictureURL,
             notifMessage)
              .then(function() {
                callback(null, {
                  Success: 0,
                  Description: null,
                  ID: trainingID[0]
                });
              })
              .catch(function(err) {
                log.error(err);
                ctrl.errorCallback(callback, 1, "Unknown error");
              });
          })
          .catch(function(err) {
            log.error(err);
            ctrl.errorCallback(callback, 1, "Unknown error");
          });
      }

    ], ctrl.asyncCallback(deferred));
    return deferred.promise;
  };

  return this;
}

module.exports = new CreateTeamTrainingController();

