var knex = require('lib/knex');
var q = require('q');
var async = require('async');
var validator = require('node-validator');
var log = require('helpers/logger');

var Controller = require('controllers/controller');
var NotificationService = require('services/notification-service');

function GetTeamDutiesController() {
  var ctrl = new Controller(this);
  this.getTeamDuties = function(request, response, app) {
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

      // Check that this user is in the team
      function(callback) {
        knex('team_players').select(['team_id', 'user_id'])
          .where({
            team_id: data.TeamID,
            user_id: request.userID
          })
          .then(function(results) {
            if (results.length == 0) {
              return ctrl.errorCallback(callback, 2,
                "You need to be in the team to do this.");
            }
            return callback(null);
          })
          .catch(function(err) {
            log.error(err);
            return ctrl.errorCallback(callback, 1,
              "Unknown error.");
          });
      },

      // Request the data
      function(callback) {
        knex('team_duties').select(['team_id', 'duty_name', 'reg_info.user_id', 'team_duties.id', 'picture'])
          .from('team_duties')
          .leftJoin('team_duty_assignments',
            'team_duty_assignments.duty_id', 'team_duties.id')
          .leftJoin('reg_info',
            'reg_info.user_id', 'team_duty_assignments.user_id')
          .where('team_id', data.TeamID)
          .then(function(results) {
            var response = { Duties: [] };
            for (var ii = 0; ii < results.length; ++ii) {
              var r = results[ii];
              // Check we've already added the object
              let added = false;
              for (let ii = 0; ii < response.Duties.length; ++ii) {
                if (response.Duties[ii].DutyID == r.id) {
                  if (typeof r.user_id !== 'undefined' &&
                    typeof r.picture !== 'undefined' && 
                    r.user_id != null && 
                    r.picture != null) {
                    response.Duties[ii].UserIDs.push({
                      UserID: r.user_id,
                      PictureURL: r.picture,
                    });
                  }
                  added = true;
                  break;
                }
              }
              if (added) { continue; }

              // We need to create a new duties object.
              let userIDs = [];
              if (typeof r.user_id !== 'undefined' &&
                typeof r.picture !== 'undefined' && 
                r.user_id != null && 
                r.picture != null) {
                userIDs.push( {
                  UserID: r.user_id,
                  PictureURL: r.picture,
                });
              }
              response.Duties.push({
                DutyID: r.id,
                DutyName: r.duty_name,
                UserIDs: userIDs,
              });
            }
            return callback(null, {
              Success: 0,
              Description: null,
              Duties: response,
            });
          })
          .catch(function(err) {
            log.error(err);
            return ctrl.errorCallback(callback, 1,
              "Unknown error.");
          });
      }

    ], ctrl.asyncCallback(deferred));
    return deferred.promise;
  };

  return this;
}

module.exports = new GetTeamDutiesController();
