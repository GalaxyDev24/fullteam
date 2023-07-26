var knex = require('lib/knex');
var q = require('q');
var async = require('async');
var util = require('util');
var validator = require('node-validator');
var log = require('helpers/logger');

var Controller = require('controllers/controller');
var UserFeedback = require('models/user-feedback');

function GetTeamFeedbackController() {
  var ctrl = new Controller(this);

  this.getTeamFeedback = function(packet) {
    var data = packet.data;
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

      // Get all team feedbacks
      function(callback) {
        knex.select(['reg_info.name', 'reg_info.last_name', 'reg_info.picture',
                     'team_feedback.average', 'team_feedback.sportsmanship',
                     'team_feedback.feedback', 
                     'team_feedback.teamwork', 'team_feedback.reliability',
                     'team_feedback.fitness'])
          .from('reg_info')
          .innerJoin('team_feedback', 'team_feedback.from_user_id', 'reg_info.user_id')
          .innerJoin('teams', 'team_feedback.team_id', 'teams.id')
          .where({
            'team_feedback.team_id': data.TeamID
          })
          .whereNull('teams.deleted_at')
          .then(function(results) {
            var response = [];
            for(var ii = 0; ii < results.length; ++ii) {
              response.push({
                PictureURL:      results[ii].picture,
                FirstName:       results[ii].name,
                LastName:        results[ii].last_name,
                Sportsmanship:   results[ii].banter,
                Teamwork:        results[ii].teamwork,
                Fitness:         results[ii].fitness,
                Reliability:     results[ii].reliability,
                AverageRating:   results[ii].average,
                FeedbackMessage: results[ii].feedback,
              });
            }
            return callback(null, {
              Success: 0,
              Description: 0,
              Feedbacks: response,
            });
          })
          .catch(function(err) {
            log.error(err);
            return ctrl.errorCallback(callback, 1,
                                      "Invalid Parameters");
          });;
      }
    ], ctrl.asyncCallback(deferred));
    return deferred.promise;
  };

  return this;
}

module.exports = new GetTeamFeedbackController();
