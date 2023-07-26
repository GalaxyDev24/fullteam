var knex = require('lib/knex');
var q = require('q');
var async = require('async');
var util = require('util');
var validator = require('node-validator');
var log = require('helpers/logger');

var Controller = require('controllers/controller');

function GetInvitedToGameController() {
    var ctrl = new Controller(this);
    
    this.getInvitedToGame = function(packet) {
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

            // Check if game exists / has expired and whether you are
            // the owner
            function(callback) {
                knex('games')
                    .select(['id', 'game_time', 'owner_id'])
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
                            if (results[0].owner_id != packet.userID) {
                                return ctrl.errorCallback(callback, 2,
                                                   "You must be the owner " +
                                                   "of the game");
                            }
                            return callback(null);
                        }
                    })
                    .catch(function(err) {
                        return ctrl.errorCallback(callback, 1,
                                                  "An unknown database " +
                                                  "error has occurred");
                    });
            },

            function(callback) {
                knex.select(['game_id', 'user_id', 'time'])
                    .from('game_invites')
                    .where({game_id: data.GameID})
                    .then(function(results) {
                        var response = [];
                        for (var ii = 0; ii < results.length; ++ii) {
                            var inviteData = {
                                ToID: results[ii].user_id,
                                GameID: data.GameID,
                                Time: results[ii].time,
                            };
                            response.push(inviteData);
                        }
                        return callback(null, {
                            success: 0,
                            Description: null,
                            InviteList: response
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

module.exports = new GetInvitedToGameController();

