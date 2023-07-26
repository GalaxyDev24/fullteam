var knex = require('lib/knex');
var q = require('q');
var async = require('async');
var validator = require('node-validator');
var log = require('helpers/logger');

var Controller = require('controllers/controller');

function BlockUserController() {
  var ctrl = new Controller(this);
  this.blockUser = function(request, response, app) {
    var data = request.data;
    var deferred = q.defer();

    // Validate params
    async.waterfall([
      function(callback) {
        var check = validator.isAnyObject()
            .withRequired('UserID', validator.isInteger());
        validator.run(check, data, function(errCount, errors) {
          if (!errCount) {
            return callback(null);
          }
          log.error(errors);
          return ctrl.errorCallback(callback, 1,
                                    "Invalid Parameters");
        });
      },

      // Check user is not blocking themselves
      function(callback) {
        if (request.userID == data.UserID) {
          return ctrl.errorCallback(callback, 1,
                                    "Can't block yourself");
        }
        return callback(null);
      },

      // Check if already blocked
      function(callback) {
        knex('blocked_users')
          .select(['user_id', 'other_user_id'])
          .whereRaw('(user_id = ? AND other_user_id = ?) OR (user_id = ? AND other_user_id = ?)', [request.userID, data.UserID, data.UserID, request.userID])
          /*.where({
            user_id: request.userID,
            other_user_id: data.UserID,
          }).or
          .where({
            user_id: data.UserID,
            other_user_id: request.userID,
          })*/
          .then(function(results) {
            if (results.length > 0) {
              return ctrl.errorCallback(callback, 2,
                                        "Already blocked");
            }
            else {
              return callback(null);
            }
          })
          .catch(function(err) {
            console.log(err);
            return ctrl.errorCallback(callback, 1,
                                      "Unknown error", err);
          });
      },

      function(callback) {
        knex('blocked_users')
          .insert({
            user_id: request.userID,
            other_user_id: data.UserID,
          })
          .then(function() {
            return callback(null, {
              success: 0,
              Description: null
            });
          })
          .catch(function(err) {
            return ctrl.errorCallback(callback, 1,
                                      "Unknown error", err);
          });
      },
    ], ctrl.asyncCallback(deferred));
    return deferred.promise;
  };


  this.unblockUser = function(request, response, app) {
    var data = request.data;
    var deferred = q.defer();

    // Validate params
    async.waterfall([
      function(callback) {
        var check = validator.isAnyObject().withRequired('UserID', validator.isInteger());
        validator.run(check, data, function(errCount, errors) {
          if (!errCount) {
            return callback(null);
          }
          log.error(errors);
          return ctrl.errorCallback(callback, 1, "Invalid Parameters");
        });
      },

      function(callback) {
        knex('blocked_users')
          .where('user_id', request.userID)
          .andWhere('other_user_id', data.UserID)
          .delete()
          .then(function() {
            return callback(null, {
              success: 0,
              Description: null
            });
          })
          .catch(function(err) {
            return ctrl.errorCallback(callback, 1, "Unknown error", err);
          });
      },
    ], ctrl.asyncCallback(deferred));
    return deferred.promise;
  };

  return this;
}

module.exports = new BlockUserController();
