var knex = require('lib/knex');
var q = require('q');
var async = require('async');
var util = require('util');
var validator = require('node-validator');
var log = require('helpers/logger');

var UserSettings = require('models/user-settings');
var Controller = require('controllers/controller');
var ValidatorsService = require('services/validators');

function ChangeSettingsController() {
  // super
  var ctrl = new Controller(this);

  this.getSettings = function(packet) {
    var data = packet.data;
    var deferred = q.defer();
    
    async.waterfall([
      function(callback) {
        var userID = packet.userID;
        knex('user_settings').where({
          'user_id': userID
        }).select('comments', 'notifications', 'searchable')
          .then(function(results) {
            console.log(results);
            if (results.length == 0) {
              callback({
                'success': 1,
                'Description': "User settings data not found"
              });
            }
            else {
              callback(null, {
                'success': 0,
                'CommentsAllowed': (results[0].comments == 1),
                'NotificationsAllowed': (results[0].notifications == 1),
                'Searchable': (results[0].searchable == 1)
              });
            }
          });
      },
    ], ctrl.asyncCallback(deferred));

    return deferred.promise;
  };

  this.changeSettings = function(packet) {
    if(typeof packet === 'undefined') {
      packet = {};
    }

    var data = packet.data;
    var deferred = q.defer();

    async.waterfall([
      // Check if fields are valid
      function(callback) {
        var check = validator.isAnyObject()
            .withRequired('CommentsAllowed', 
                          ValidatorsService.isBoolean)
            .withRequired('NotificationsAllowed', 
                          ValidatorsService.isBoolean)
            .withRequired('Searchable', 
                          ValidatorsService.isBoolean);

        validator.run(check, data, function(errorCount, errors) {
          if(!errorCount) {
            return callback(null);
          }
          log.error(util.inspect(errors));

          return ctrl.errorCallback(callback, 1, "Invalid Parameters");
        });
      },

      function(callback) {
        var userID = packet.userID;

        var comments = data.CommentsAllowed;
        var notifications = data.NotificationsAllowed;
        var searchable = data.Searchable;

        knex.raw("INSERT INTO user_settings (user_id, " + 
                 "comments, notifications, searchable) VALUES(?,?,?,?) " + 
                 "ON DUPLICATE KEY UPDATE comments=?, notifications=?, " + 
                 "searchable=?", 
                 [userID, comments, notifications, searchable,
                  comments, notifications, searchable]).then(
                    function(model) {
                      callback(null, {
                        'success': 0,
                        'Description': null
                      });
                    },
                    function(model) {
                      callback({
                        'success': 1,
                        'Description': "An unkown error has occurred " + 
                          "whilst inserting the user data."
                      });
                    }
                  );
      }

    ], ctrl.asyncCallback(deferred));

    return deferred.promise;
  };

  return this;

}

// Returns 
module.exports = new ChangeSettingsController();
