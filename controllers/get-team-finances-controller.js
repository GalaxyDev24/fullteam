var knex = require('lib/knex');
var q = require('q');
var async = require('async');
var validator = require('node-validator');
var log = require('helpers/logger');

var Controller = require('controllers/controller');
var NotificationService = require('services/notification-service');

function GetTeamFinancesController() {
  var ctrl = new Controller(this);
  this.getTeamFinances = function(request, response, app) {
    var data = request.data;
    var deferred = q.defer();

    async.waterfall([
      // Validate params
      function(callback) {
        var check = validator.isAnyObject()
            .withRequired('TeamID', validator.isInteger());
        validator.run(check, data, function(errCount, errors) {
          if (!errCount) {
            return callback(null);
          }
          log.error(errors);
          return ctrl.errorCallback(callback, 1,
                                    "Invalid Parameters");
        });
      },

      // Check if exists
      function(callback) {
        knex('teams')
          .select()
          .where('id', data.TeamID)
          .whereNull('deleted_at')
          .then(function(results) {
            if (results.length == 0) {
              return ctrl.errorCallback(callback, 1, "Team no longer exists");
            }
            return callback(null);
          })
          .catch(function(err) {
            return ctrl.errorCallback(callback, 1,
                                      "Unknown error");
          });
      },

      // Check if member of the team
      function(callback) {
        knex('team_players')
          .select(['user_id', 'team_id'])
          .where({
            user_id: request.userID,
            team_id: data.TeamID
          })
          .then(function(results) {
            if (results.length == 0) {
              return ctrl.errorCallback(callback, 2,
                                        "Need to be part of this team");
            }
            return callback(null);
          })
          .catch(function(err) {
            return ctrl.errorCallback(callback, 1,
                                      "Unknown error");
          });
      },

      // Return finances data
      function(callback) {
        // SELECT 
        // team_players.user_id, 
        // team_players.finances, 
        // team_players.team_id,
        // CONCAT(reg_info.name, ' ', reg_info.last_name) AS user_fullname,
        // reg_info.picture
        // FROM team_players 
        // INNER JOIN reg_info ON reg_info.user_id = team_players.user_id
        // WHERE team_players.team_id = 30

        knex('team_players')
          .select([
            'team_players.user_id', 
            'team_players.finances', 
            'team_players.team_id',
            knex.raw("CONCAT(reg_info.name, ' ', reg_info.last_name) AS user_fullname"),
            'reg_info.picture',
          ])
          .innerJoin("reg_info", "reg_info.user_id", "team_players.user_id")
          .where('team_players.team_id', data.TeamID)
          .then(function(results) {
            var finances = [];
            for (var ii = 0; ii < results.length; ++ii) {
              finances.push({
                UserID: results[ii].user_id,
                Finances: results[ii].finances,
                UserFullName: results[ii].user_fullname,
                PictureURL: results[ii].picture
              });
            }
            return callback(null, {
              Success: 0,
              Description: null,
              Finances: finances
            });
          })
          .catch(function(err) {
            return ctrl.errorCallback(callback, 1,
                                      "Unknown error");
          });
      },

            ], ctrl.asyncCallback(deferred));
    return deferred.promise;
  };

  return this;
}

module.exports = new GetTeamFinancesController();

