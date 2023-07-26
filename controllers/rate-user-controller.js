var knex = require('lib/knex');
var q = require('q');
var async = require('async');
var validator = require('node-validator');
var log = require('helpers/logger');
var Controller = require('controllers/controller');
var NewsfeedService = require('services/newsfeed-service');
var NotificationService = require('services/notification-service');
var firebase = require('helpers/firebase');
var BlockedUsersService = require('services/blocked-users-service');
var RatingsService = require('services/ratings-service');

function RateUserController() {
  var ctrl = new Controller(this);

  this.rateUser = function(request, response, app) {
    var data = request.data;
    var deferred = q.defer();

    async.waterfall([
      // Validate params
      function(callback) {
        var check = validator.isAnyObject()
          .withRequired('UserID',
            validator.isInteger())
          .withRequired('Passing',
            validator.isNumber({
              min: 0,
              max: 5
            }))
          .withRequired('Shooting',
            validator.isNumber({
              min: 0,
              max: 5
            }))
          .withRequired('Fitness',
            validator.isNumber({
              min: 0,
              max: 5
            }))
          .withRequired('Reliability',
            validator.isNumber({
              min: 0,
              max: 5
            }))
          .withRequired('FeedbackMessage',
            validator.isString());

        validator.run(check, data, function(errCount, errors) {
          if (!errCount) {
            return callback(null);
          }
          log.error(errors);
          return ctrl.errorCallback(callback, 1,
            "Invalid request params");
        });
      },

      // Check the user is not rating themselves
      function(callback) {
        if (data.UserID == request.userID) {
          return ctrl.errorCallback(callback, 1, "You cannot rate yourself");
        } else {
          return callback(null);
        }
      },

      // Check the user is not blocked
      function(callback) {
        BlockedUsersService.isUserBlocked(request.userID, data.UserID)
          .then(function(result) {
            if (!result) {
              return callback(null);
            }
            return ctrl.errorCallback(callback, 1, "User blocked");
          })
          .catch(function(err) {
            return ctrl.errorCallback(callback, 1, "Unknown error");
          });
      },

      // Check the user has not already been rated
      function(callback) {
        RatingsService.hasUserBeenRatedBy(data.UserID, request.userID).then(function(results) {
          if (results) {
            return ctrl.errorCallback(callback, 1, "User already rated");
          }
          return callback(null);
        });
      },

      // Get user data for notif
      function(callback) {
        knex('reg_info').select(['name', 'last_name', 'picture', 'user_id'])
          .where('user_id', request.userID)
          .then(function(results) {
            if (results.length == 0) {
              return ctrl.errorCallback(callback, 1,
                "Cannot get user data");
            }
            callback(null, results[0].name, results[0].last_name, results[0].picture);
          })
          .catch(function(err) {
            return ctrl.errorCallback(callback, 1, "Unknown error");
          });
      },

      // Insert data feedback
      function(firstName, lastName, pictureURL, callback) {
        //INSERT INTO user_feedback SET
        //profile_user_id=?,from_user_id=?,
        //passing=?,shooting=?,fitness=?,reliability=?,average=?,
        //feedback=?,time_sent=?;
        var average = (data.Shooting + data.Passing + data.Fitness + data.Reliability) / 4;
        knex('user_feedback').insert({
            profile_user_id: data.UserID,
            from_user_id: request.userID,
            passing: data.Passing,
            shooting: data.Shooting,
            fitness: data.Fitness,
            reliability: data.Reliability,
            average: average,
            feedback: data.FeedbackMessage,
            time_sent: (new Date()).getTime(),
          })
          .then(function(success) {
            return callback(null, firstName, lastName, pictureURL);
          })
          .catch(function(error) {
            console.log(error);
            ctrl.errorCallback(callback, 1, "Unknown error");
          });
      },

      // Insert data to posts
      function(firstName, lastName, pictureURL, callback) {

        var average = (data.Shooting + data.Passing + data.Fitness + data.Reliability) / 4;

        var ratings = {
          "Passing": data.Passing,
          "Shooting": data.Shooting,
          "Fitness": data.Fitness,
          "Reliability": data.Reliability,
          "AverageRating": average,
          "FeedbackMessage": data.FeedbackMessage
        };

        var notification = {
          type: NotificationService.notificationTypes.RECEIVED_RATING,
          timestamp: (new Date()).getTime(),
          data: JSON.stringify({
            'UserID': request.userID,
            'FirstName': firstName,
            'LastName': lastName,
            'PictureURL': pictureURL,
            'Passing': data.Passing,
            'Shooting': data.Shooting,
            'Fitness': data.Fitness,
            'Reliability': data.Reliability,
            'AverageRating': average,
            'FeedbackMessage': data.FeedbackMessage,
          }),
        };

        var notifMessage = firstName + " " + lastName + " has rated you.";

        return Promise.all([
          NewsfeedService.createSystemPost({
            'userID': request.userID, 
            'postTitle': "rated this player", 
            'postContent': '', 
            'postType': 'rating', 
            'postParentID': data.UserID, 
            'postParentType': 'user', 
            'postMeta': ratings
          }),
          NotificationService.sendNotifications(
            [data.UserID],
            notification,
            notifMessage,
            app),
        ]).then(function() {
          return callback(null, {
            success: 0,
            Description: null
          });
        }, function(err) {
          ctrl.errorCallback(callback, 1, "Error sending notification", err);
        });
      },

    ], ctrl.asyncCallback(deferred));

    return deferred.promise;
  };

  return this;
}

module.exports = new RateUserController();
