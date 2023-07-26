var knex = require('lib/knex');
var q = require('q');
var async = require('async');
var validator = require('node-validator');
var log = require('helpers/logger');

var Controller = require('controllers/controller');
var NotificationService = require('services/notification-service');

function SetTeamFinancesController() {
  var ctrl = new Controller(this);
  this.getTeamFinances = function(request, response, app) {
    var data = request.data;
    var deferred = q.defer();

    async.waterfall([
      // Validate params
      function(callback) {
        var check = validator.isAnyObject()
            .withRequired('TeamID', validator.isInteger())
            .withRequired('Finances', validator.isAnyObject());
        validator.run(check, data, function(errCount, errors) {
          if (!errCount) {
            return callback(null);
          }
          log.error(errors);
          return ctrl.errorCallback(callback, 1,
                                    "Invalid Parameters");
        });
      },

      // Check if manager of team
      function(callback) {
        knex('teams').select(['id', 'manager_id'])
          .where('id', data.TeamID)
          .then(function(results) {
            if (results.length == 0) {
              return ctrl.errorCallback(callback, 1,
                                        "Can't find team with that ID");
            }
            if (results[0].manager_id != request.userID) {
              return ctrl.errorCallback(callback, 2,
                                        "You need to be the team manager to do that");
            }
            return callback(null);
          })
          .catch(function(err) {
            return ctrl.errorCallback(callback, 1,
                                      "Unknown error");
          });
      },

      // Update all users' finances
      function(callback) {
        var tasks = [];
        for (var f in data.Finances) {
          if (data.Finances.hasOwnProperty(f)) {
            var task = knex('team_players')
                .update({finances: data.Finances[f]})
                .where({
                  user_id: f,
                  team_id: data.TeamID
                });
            tasks.push(task);
          }
        }
        Promise.all(tasks).then(
          function() {
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

module.exports = new SetTeamFinancesController();


