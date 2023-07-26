var knex = require('lib/knex');
var q = require('q');
var async = require('async');
var util = require('util');
var validator = require('node-validator');
var log = require('helpers/logger');

var Controller = require('controllers/controller');


function GetGameApplicationsController() {
  var ctrl = new Controller(this);
  
  this.getGameApplications = function(packet) {
    var data = packet.data;
    var deferred = q.defer();
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

      // Check if game exists / has expired
      function(callback) {
        knex('games')
          .select(['id', 'game_time'])
          .where({
            id: data.GameID,
          })
          .andWhere('game_time', '>', (new Date()).getTime())
          .then(function(results) {
            if (results.length == 0) {
              return ctrl.errorCallback(callback, 10,
                                        "No game exists");
            }
            else {
              return callback(null);
            }
          })
          .catch(function(err) {
            console.log(err);
            return ctrl.errorCallback(callback, 1,
                                      "An unknown database " +
                                      "error has occurred");
          });
      },

      function(callback) {
        knex.select(['game_id', 'user.id as uid', 'position'])
          .from('game_applications')
          .leftJoin('user', 'user.id', 'game_applications.user_id')
          .leftJoin('user_positions', 'user.id', 'user_positions.user_id')
          .where({game_id: data.GameID})
          .orderBy('uid', 'asc')
          .then(function(results) {
            console.log(results);
            var response = [];
            var currUserID = -1;
            for (var ii = 0; ii < results.length;) {
              currUserID = results[ii].uid;
              var positions = [];
              var counter = 0;
              while (results.length > ii + counter &&
                     currUserID == results[ii + counter].uid) {
                positions.push(results[ii + counter].position);
                counter ++;
              }
              var applicationData = {
                UserID: results[ii].uid,
                Positions: positions
              };
              response.push(applicationData);
              ii += counter;
            }
            return callback(null, {
              success: 0,
              Description: null,
              ApplicationsList: response
            });
          })
          .catch(function(err) {
            console.log(err);
            return ctrl.errorCallback(callback, 1,
                                      "An unknown database error " +
                                      "has occurred");
          });
      },
    ], ctrl.asyncCallback(deferred));
    return deferred.promise;
  };

  return this;
};

module.exports = new GetGameApplicationsController();
