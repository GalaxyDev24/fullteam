var knex = require('lib/knex'),
  q = require('q'),
  _ = require('lodash'),
  config = require('config'),
  async = require('async'),
  util = require('util'),
  validate = require("validate.js"),
  log = require('helpers/logger'),
  firebase = require('helpers/firebase'),
  teamService = require('services/team-service'),
  notificationService = require('services/notification-service');

var Controller = require('controllers/controller');

function TeamController() {
  var ctrl = new Controller(this);

  this.getAll = function(request) {
    var data = request.data;
    var response = {};
    var deferred = q.defer();
    async.waterfall([
      // Get user's teams
      function(callback) {
        knex.select('notifications.*')
          .from('notifications')
          .where('notifications.user_id', request.userID)
          .where(function(){
            if(data.LastNotificationID) {
              this.whereRaw("notifications.time <= (SELECT notifications.time FROM notifications WHERE notifications.id = ?) AND notifications.id <> ?", [data.LastNotificationID, data.LastNotificationID]);
            }
          })
          .orderBy('notifications.time', 'desc')
          .limit(10)
          .then(function(notifications) {
            if (typeof notifications === 'undefined') {
              notifications = [];
            }

            response.Notifications = notifications.map(function(notification){
              return {
                'ID': notification.id,
                'userID': request.userID,
                'type': notification.type,
                'timestamp': notification.time,
                'data': notification.data,
                'pretty_message': notification.pretty_message,
                'DataObject': JSON.parse(notification.data),
                'processed': notification.processed,
                'seen': notification.seen,
              };
            });

            return callback(null);
          }, function(err) {
            return ctrl.errorCallback(callback, 1, "Cannot find notifications");
          });

      },

      // Returns the response..
      function(callback) {
        return callback(null, response);
      },

    ], ctrl.asyncCallback(deferred));
    return deferred.promise;
  };

  this.updateNotification = function(request) {
    var data = request.data;
    var response = {};
    var deferred = q.defer();
    var updateNotificationsRequestConstraints = {
      NotificationID: {
        presence: {
          message: "is required"
        },
        numericality: {
          onlyInteger: true
        }
      }
    };

    async.waterfall([
      // Data validation...
      function(callback) {
        var errors = validate(data, updateNotificationsRequestConstraints);
        if (errors) {
          return ctrl.errorCallback(callback, 1, "Invalid Parameters", errors);
        }
        return callback(null);
      },

      // Check user notifications
      function(callback) {
        knex.select('notifications.*')
          .from('notifications')
          .where('notifications.id', data.NotificationID)
          .then(function(notifications) {
            console.log(notifications);
            if (notifications.length === 0) {
              return ctrl.errorCallback(callback, 2, "Notification does not exist");
            }

            if (notifications[0].user_id !== request.userID) {
              return ctrl.errorCallback(callback, 3, "You are not the owner of this notification");
            }

            return callback(null);
          }, function(err) {
            console.log(err);
            return ctrl.errorCallback(callback, 1, "Cannot find notifications");
          });          
      },

      // Update notification
      function(callback) {
        knex('notifications')
          .where('id', data.NotificationID)
          .update('processed', true)
          .then(function(results) {
            return callback(null);
          }, function(err) {
            console.log(err);
            return ctrl.errorCallback(callback, 1, "Unknown error");
          });
      },

      // Returns the response..
      function(callback) {
        return callback(null, response);
      },

    ], ctrl.asyncCallback(deferred));
    return deferred.promise;
  };


  this.bulkUpdateNotification = function(request) {
    var data = request.data;
    var response = {};
    var deferred = q.defer();
    var bulkUpdateNotificationsRequestConstraints = {
      NotificationIDs: {
        presence: {
          message: "is required"
        } 
      },
      UpdateType: {
        presence: {
          message: "is required"
        },
        inclusion: ["seen", "processed"]
      }
    };

    var notificationIDs = data.NotificationIDs.map(function(id) {
      return parseInt(id);
    });

    async.waterfall([
      // Data validation...
      function(callback) {
        var errors = validate(data, bulkUpdateNotificationsRequestConstraints);
        if (errors) {
          return ctrl.errorCallback(callback, 1, "Invalid Parameters", errors);
        }
        return callback(null);
      },

      // Update notification
      function(callback) {
        knex('notifications')
          .whereIn('id', notificationIDs)
          .andWhere('user_id', request.userID)
          .update(data.UpdateType, true)
          .then(function(results) {
            return callback(null);
          }, function(err) {
            console.log(err);
            return ctrl.errorCallback(callback, 1, "Unknown error");
          });
      },

      // Returns the response..
      function(callback) {
        return callback(null, response);
      },

    ], ctrl.asyncCallback(deferred));
    return deferred.promise;
  };


}

module.exports = new TeamController();
