var knex = require('lib/knex');
var q = require('q');
var async = require('async');
var validator = require('node-validator');
var log = require('helpers/logger');
var firebase = require('helpers/firebase');

var Controller = require('controllers/controller');
var NotificationService = require('services/notification-service');
var NewsfeedService = require('services/newsfeed-service');

function RateTeamController() {
  var ctrl = new Controller(this);
  this.rateTeam = function(request, response, app) {
    var data = request.data;
    var deferred = q.defer();

    var currentTeam = null;

    async.waterfall([
      // Validate params
      function(callback) {
        var check = validator.isAnyObject()
            .withRequired('TeamID', validator.isInteger())
            .withRequired('Sportsmanship', validator.isNumber({min: 0, max: 5}))
            .withRequired('Teamwork', validator.isNumber({min: 0, max: 5}))
            .withRequired('Fitness', validator.isNumber({min: 0, max: 5}))
            .withRequired('Reliability', validator.isNumber({min: 0, max: 5}))
            .withRequired('FeedbackMessage', validator.isString());
        validator.run(check, data, function(errCount, errors) {
          if (!errCount) {
            return callback(null);
          }
          log.error(errors);
          return ctrl.errorCallback(callback, 1,
                                    "Invalid Parameters");
        });
      },

      // Check if team exists
      function(callback) {
        knex('teams').select()
          .where({
            id: data.TeamID
          })
          .whereNull('deleted_at')
          .then(function(results) {
            if (results.length == 0) {
              return ctrl.errorCallback(callback, 1,
                                      "Team no longer exists");
            }

            return callback(null);
          })
          .catch(function(err) {
            console.log(err);
            return ctrl.errorCallback(callback, 1,
                                      "Unknown Error");
          });
      },

      // Check if already rated
      function(callback) {
        knex('team_feedback').select(['team_id', 'from_user_id'])
          .where({
            team_id: data.TeamID,
            from_user_id: request.userID
          })
          .then(function(results) {
            if (results.length == 0) {
              return callback(null);
            }
            return ctrl.errorCallback(callback, 2,
                                      "Already rated");
          })
          .catch(function(err) {
            console.log(err);
            return ctrl.errorCallback(callback, 1,
                                      "Unknown Error");
          });
      },

      // Add rating
      function(callback) {
        var average = (data.Sportsmanship
                       + data.Teamwork
                       + data.Fitness
                       + data.Reliability)/4;

        knex('team_feedback').insert({
          team_id: data.TeamID,
          from_user_id: request.userID,
          teamwork: data.Teamwork,
          sportsmanship: data.Sportsmanship,
          fitness: data.Fitness,
          reliability: data.Reliability,
          average: average,
          feedback: data.FeedbackMessage,
          time_sent: (new Date()).getTime(),
        })
          .then(function() {
            return callback(null);
          })
          .catch(function(err) {
            console.log(err);
            return ctrl.errorCallback(callback, 1,
                                      "Unknown Error");
          });
      },

      // Get team manager
      function(callback) {
        knex('teams').select()
          .where('id', data.TeamID)
          .first()
          .then(function(team) {
            if (typeof team === 'undefined') {
              return callback(null);
            }

            currentTeam = team;
            return callback(null);
          })
          .catch(function(err) {
            console.log(err);
            return ctrl.errorCallback(callback, 1,
                                      "Unknown Error");
          });
      },

      // Get user data for notif
      function(callback) {
        knex('reg_info').select(['name', 'last_name', 'picture', 'user_id'])
          .where('user_id', request.userID)
          .then(function(results) {
            if (results.length === 0) {
              return ctrl.errorCallback(callback, 1,
                "Cannot get user data");
            }
            callback(null, results[0].name, results[0].last_name, results[0].picture);
          })
          .catch(function(err) {
            console.log(err);
            return ctrl.errorCallback(callback, 1, "Error while retrieving user data for notification");
          });
      },

      // Insert data to posts
      function(firstName, lastName, pictureURL, callback) {
        if (typeof currentTeam === 'undefined') {
          return callback(null);
        }

        var teamManager = currentTeam.manager_id;

        var average = (data.Sportsmanship + data.Teamwork + data.Fitness + data.Reliability) / 4;

        var ratings = {
          "Sportsmanship":    data.Sportsmanship,
          "Teamwork":         data.Teamwork,
          "Fitness":          data.Fitness,
          "Reliability":      data.Reliability,
          "AverageRating":    average,
          "FeedbackMessage":  data.FeedbackMessage
        };

        var notification = {
          type: NotificationService.notificationTypes.RECEIVED_RATING,
          timestamp: (new Date()).getTime(),
          data: JSON.stringify({
            'TeamID':           data.TeamID,
            'UserID':           request.userID,
            'FirstName':        firstName,
            'LastName':         lastName,
            'PictureURL':       pictureURL,
            'Sportsmanship':    data.Sportsmanship,
            'Teamwork':         data.Teamwork,
            'Fitness':          data.Fitness,
            'Reliability':      data.Reliability,
            'AverageRating':    average,
            'FeedbackMessage':  data.FeedbackMessage,
          }),
        };

        var notifMessage = firstName + " " + lastName + " has rated your team.";

        return Promise.all([
          NewsfeedService.createSystemPost({
            'userID':         request.userID, 
            'postTitle':      'rated this team', 
            'postContent':    '', 
            'postType':       'rating', 
            'postParentID':   data.TeamID, 
            'postParentType': 'team', 
            'postMeta':       ratings
          }),
          NotificationService.sendNotifications(
            [teamManager],
            notification,
            notifMessage,
            app),
        ]).then(function() {
          return callback(null, {
            success: 0,
            Description: null
          });
        }, function(err) {
          console.log(err);
          ctrl.errorCallback(callback, 1, "Error sending notification", err);
        });
      }

    ], ctrl.asyncCallback(deferred));
    return deferred.promise;
  };

  return this;
}

module.exports = new RateTeamController();

