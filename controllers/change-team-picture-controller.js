var knex = require('lib/knex');
var q = require('q');
var async = require('async');
var validator = require('node-validator');
var log = require('helpers/logger');
var suid = require('rand-token').suid;
var config = require('config');

var Controller = require('controllers/controller');
var NotificationService = require('services/notification-service');

function ChangeTeamPictureController() {
  var ctrl = new Controller(this);
  this.changeTeamPicture = function(request, response, app) {
    var data = request.data;
    var deferred = q.defer();

    async.waterfall([
      // Validate params
      function(callback) {
        var check = validator.isAnyObject()
            .withRequired('TeamID', validator.isInteger())
            .withRequired('Picture', validator.isString());
        validator.run(check, data, function(errCount, errors) {
          if (!errCount) {
            return callback(null);
          }
          log.error(errors);
          return ctrl.errorCallback(callback, 1,
                                    "Invalid Parameters");
        });
      },

      // Check if this user is the manager of the team
      function(callback) {
        knex('teams').select('manager_id', 'id').where('id', data.TeamID)
          .then(function(results) {
            if (results.length == 0) {
              return ctrl.errorCallback(callback, 1,
                                        "Team ID not found");
            }
            if (results[0].manager_id != request.userID) {
              return ctrl.errorCallback(callback, 2,
                                        "You are not the manager of this team");
            }
            return callback(null);
          })
          .catch(function(err) {
            return ctrl.errorCallback(callback, 1,
                                      "Unknown error");
          });
      },

      // Decode and store image
      function(callback) {

        if (typeof data.Picture === 'undefined' || !data.Picture ) {
          return callback(null);
        }

        var fs                  = require('fs');
        var img                 = data.Picture;
        var sanitizedImageData  = img.replace(/^data:image\/\w+;base64,/, "");
        var buf                 = new Buffer(sanitizedImageData, 'base64');
        var filename            = suid(32) + '.jpg';

        fs.writeFile('public/UserUploads/TeamPictures/' + filename, buf, function(err) {
          
          if(err) {
            return callback(err);
          }

          var url = config.baseUrl + 'UserUploads/TeamPictures/' + filename;
          callback(null, url);

        });
      },

      // Store URL in db
      function(pictureURL, callback) {
        knex('teams').update('picture', pictureURL)
          .where('id', data.TeamID)
          .then(function() {
            return callback(null, {success: 0, Description: null});
          })
          .catch(function(err) {
            console.log(err);
            return ctrl.errorCallback(callback, 1,
                                      "Unknown error");
          });
      }], ctrl.asyncCallback(deferred));
    return deferred.promise;
  };

  return this;
}

module.exports = new ChangeTeamPictureController();


