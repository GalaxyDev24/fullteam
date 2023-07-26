var knex = require('lib/knex');
var q = require('q');
var async = require('async');
var util = require('util');
var validator = require('node-validator');
var log = require('helpers/logger');

var UserSettings = require('models/user-settings');
var Controller = require('controllers/controller');
var ValidatorsService = require('services/validators');

function GetAllNotificationsController() {
  // super
  var ctrl = new Controller(this);

  this.getAllNotifications = function(packet) {
    var data = packet.data;
    var deferred = q.defer();
    
    async.waterfall([
      function(callback) {
        knex('notifications')
          .select(['*'])
          .where('user_id', packet.userID)
          .then(function(results) {
            var response = {};
            var notifications = [];
            for (var ii = 0; ii < results.length; ++ii) {
              notifications.push({
                ID: results[ii].id,
                UserID: results[ii].user_id,
                Type: results[ii].type,
                Timestamp: results[ii].time,
                Read: results[ii].seen,
                Data: JSON.parse(results[ii].data),
              });
            }
            response.Notifications = notifications;
            response.success = 0;
            response.Description = null;
            callback(null, response);
          })
          .catch(function(err) {
            console.log(err);
            return callback({
              success: 1,
              Description: "Failed to fetch notifications"
            });
          });
      },
    ], ctrl.asyncCallback(deferred));
    return deferred.promise;
  };
}

// Returns 
module.exports = new GetAllNotificationsController();

