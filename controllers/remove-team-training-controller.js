var knex = require('lib/knex');
var q = require('q');
var async = require('async');
var validator = require('node-validator');
var log = require('helpers/logger');

var Controller = require('controllers/controller');
var ValidatorsService = require('services/validators')

function RemoveTeamTrainingController() {
  var ctrl = new Controller(this);
  this.removeTeamTraining = function(request, response, app) {
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

      // Delete all training responses from DB
      function(callback) {
        knex.transaction(function(trx) {
          trx.raw('DELETE team_training_responses FROM team_training_responses ' +
                  'LEFT JOIN team_training ON ' +
                  'team_training_responses.training_id = team_training.id ' +
                  'WHERE team_training.team_id = ?', [data.TeamID])
            .then(function() {
              callback(null, trx);
            })
            .catch(function(err) {
              log.error(err);
              trx.rollback();
              return ctrl.errorCallback(callback, 1, "Unknown error");
            });
        })
          .catch(function(err) {
            log.error(err);
            trx.rollback();
            return ctrl.errorCallback(callback, 1, "Unknown error");
          });
      },

      // Delete team training from DB
      function(trx, callback) {
        knex('team_training').transacting(trx).del()
          .where('team_id', data.TeamID)
          .then(function() {
            trx.commit();
            callback(null, {
              Success: 0,
              Description: null,
            });
          })
          .catch(function(err) {
            log.error(err);
            trx.rollback();
            return ctrl.errorCallback(callback, 1, "Unknown error");
          });
      },
    ], ctrl.asyncCallback(deferred));
    return deferred.promise;
  };

  return this;
}

module.exports = new RemoveTeamTrainingController();

