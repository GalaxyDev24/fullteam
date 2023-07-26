var knex = require('lib/knex');
var q = require('q');
var async = require('async');
var util = require('util');
var validator = require('node-validator');
var log = require('helpers/logger');
var app = require('lib/application');
var moment = require('moment');
var UserLocation = require('models/user-location');
var Controller = require('controllers/controller');
var ValidatorsService = require('services/validators');

function ChangeLocationController() 
{
    // super
    var ctrl = new Controller(this);

    this.changeLocation = function(packet, response) {

        if(typeof packet === 'undefined') {
            packet = {};
        }

        response = {
          Success: 0,
          Description: null
        };

        var timeNow = moment().format("YYYY-MM-DD HH:mm:ss");    
        var data = packet.data;
        var deferred = q.defer();

        async.waterfall([
            // Check if fields are valid
            function(callback) {

                
                var check = validator.isAnyObject()
                    .withRequired('Latitude', 
                                  validator.isNumber())
                    .withRequired('Longitude', 
                                  validator.isNumber())
                    .withRequired('Locality', 
                                  validator.isString())
                    .withRequired('Country', 
                                  validator.isString());

                validator.run(check, data, function(errorCount, errors) {
                    if(!errorCount) {
                        return callback(null);
                    }
                    log.error(util.inspect(errors));

                    return ctrl.errorCallback(callback, 1, "Invalid Parameters");
                });
            },
            // Get previous location
            function(callback) {
                var userID = packet.userID;

                knex('user_location')
                  .where('user_id', userID)
                  .first()
                  .then(function(userLocation) {
                    callback(null, userLocation);
                  })
                  .catch(function(err) {
                    return ctrl.errorCallback(callback, 1, "Unknown error");
                  });

            },

            function(userLocation, callback) {
                if (typeof userLocation === 'undefined' || !userLocation) {
                  return callback(null, userLocation);
                }

                // Save previous location..
                knex('user_location_history')
                  .insert({
                    user_id: userLocation.user_id,
                    lat: userLocation.lat,
                    lon: userLocation.lon,
                    locality: userLocation.locality,
                    country: userLocation.country,
                    created_at: timeNow,
                    updated_at: timeNow
                  })
                  .then(function(success) {
                    return callback(null, userLocation);
                  })
                  .catch(function(error) {
                    // We dont really care if there was an error here.
                    return callback(null, userLocation);
                  });

            },

            function(userLocation, callback) {

                var userLocationData = {
                  lat: data.Latitude,
                  lon: data.Longitude,
                  locality: data.Locality,
                  country: data.Country,
                };

                if (typeof userLocation === 'undefined' || !userLocation) {
                  userLocationData.user_id = packet.userID;
                  knex('user_location')
                    .insert(userLocationData)
                    .then(function(success) {
                      return callback(null, response);
                    })
                    .catch(function(error) {
                      console.log(error);
                      return ctrl.errorCallback(callback, 1, "Unknown error while inserting user location.", error);
                    });
                } else {
                  knex('user_location')
                    .where('user_id', packet.userID)
                    .update(userLocationData)
                    .then(function(success) {
                      return callback(null, response);
                    })
                    .catch(function(error) {
                      console.log(error);
                      return ctrl.errorCallback(callback, 1, "Unknown error while updating user location.", error);
                    });
                }
            }

        ], ctrl.asyncCallback(deferred));

        return deferred.promise;
    };

    return this;

}

// Returns 
module.exports = new ChangeLocationController();
