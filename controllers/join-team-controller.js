var knex = require('lib/knex');
var q = require('q');
var async = require('async');
var validate = require("validate.js");
var Controller = require('controllers/controller');

function JoinTeamController() {
    var ctrl = new Controller(this);
    this.joinTeam = function(request) {
        var data = request.data;
        var response = {};
        var joinTeamDataRequestConstraints = {
          TeamID: {
            presence: {
              message: "is required"
            },
            numericality: {
              onlyInteger: true,
              greaterThan: 0
            }
          },
          PositionID: {
            presence: {
              message: "is required"
            },
            numericality: {
              onlyInteger: true,
              greaterThan: 0
            }
          }
        };

        var deferred = q.defer();

        async.waterfall([
          
          // Data validation...
          function(callback) {
            var errors = validate(data, joinTeamDataRequestConstraints);
            if (errors) {
              return ctrl.errorCallback(callback, 1, "Invalid Parameters", errors);
            }

            return callback(null);
          },

          // Check if this user is the manager of the team
          function(callback) {
            knex('teams').select('manager_id')
              .where('id', data.TeamID)
              .then(function(results) {

                if (results.length === 0) {
                  return ctrl.errorCallback(callback, 2, "Team doesn\'t exist");
                }

                if (results[0].manager_id !== request.userID) {
                  return ctrl.errorCallback(callback, 3, "You are not the owner of this team");
                }
                
                return callback(null);
              }, function(err) {
                console.log(err);
                return ctrl.errorCallback(callback, 1, "Unknown error");
              });
          },

          // Check if this user is already part of the team
          function(callback) {
            knex('team_players').select()
              .where('team_id', data.TeamID)
              .where('user_id', request.userID)
              .then(function(results) {

                if (results.length !== 0) {
                  return ctrl.errorCallback(callback, 4, "You have already joined this team.");
                }
                
                return callback(null);
              }, function(err) {
                console.log(err);
                return ctrl.errorCallback(callback, 1, "Unknown error");
              });
          },

          // Add user to team
          function(callback) {
            knex('team_players')
              .insert({
                team_id: data.TeamID,
                user_id: request.userID,
                position: data.PositionID
              })
              .then(function(results) {
                return callback(null, response);
              }, function(err) {
                console.log(err);
                return ctrl.errorCallback(callback, 1, "Error inserting team player.");
              });
          },

        ], ctrl.asyncCallback(deferred));
        return deferred.promise;
    };
}

module.exports = new JoinTeamController();
