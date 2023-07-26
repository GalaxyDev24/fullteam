var knex = require('lib/knex');
var q = require('q');
var async = require('async');
var validator = require('node-validator');
var log = require('helpers/logger');

var Controller = require('controllers/controller');
var GeoService = require('services/geo-service');
var ValidatorsService = require('services/validators')

function GetTeamGameInvitesController() {
  var ctrl = new Controller(this);
  this.getTeamGameInvites = function(request, response, app) {
    var data = request.data;
    var deferred = q.defer();
    var response = {};

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
          return ctrl.errorCallback(callback, 1,
                                    "Invalid Parameters");
        });
      },

      // Check that this user is part of the team
      function(callback) {
        knex('games').select()
          .innerJoin('teams', 'teams.id', 'games.team_id')
          .where('games.id', data.GameID)
          .whereNull('teams.deleted_at')
          .then(function(results) {
            if (results.length == 0) {
              return ctrl.errorCallback(callback, 1,
                                        "Team doesn\'t exist");
            }
            if (results[0].manager_id == request.userID) {
              return callback(null);
            }
            knex('team_players').select(['team_id', 'user_id'])
              .innerJoin('teams', 'teams.id', 'team_players.team_id')
              .where({'user_id': request.userID,
                      'team_id': results[0].team_id})
              .whereNull('deleted_at')
              .then(function(results) {
                
                if (results.length === 0) {
                  return ctrl.errorCallback(callback, 2,
                                            "You are not part of this team.");
                }
                return callback(null);
              });
          })
          .catch(function(err) {
            log.error(err);
            return ctrl.errorCallback(callback, 1,
                                      "Unknown error");
          });
      },

      // Return game invites info
      function(callback) {
        knex('game_invites').select([
          'game_invites.game_id as GameID',
          'game_invites.user_id as UserID',
          'game_invites.time as Time', 
          'game_invites.status as Status'])
          .innerJoin('games', 'games.id', 'game_invites.game_id')
          .innerJoin('teams', 'teams.id', 'games.team_id')
          .where('game_invites.game_id', data.GameID)
          .whereNull('teams.deleted_at')
          .then(function(game_invites) {

            response.Success = 0;
            response.Description = null;
            response.GameInvites = game_invites;

            return callback(null, response);
          })
          .catch(function(err) {
            log.error(err);
            return ctrl.errorCallback(callback, 1,
                                      "Unknown error");
          });
      },

    ], ctrl.asyncCallback(deferred));
    return deferred.promise;
  };

  return this;
}

module.exports = new GetTeamGameInvitesController();
