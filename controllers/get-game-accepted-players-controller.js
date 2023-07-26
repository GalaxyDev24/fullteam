var knex = require('lib/knex');
var q = require('q');
var async = require('async');
var util = require('util');
var validator = require('node-validator');
var log = require('helpers/logger');

var Controller = require('controllers/controller');

function GetGameAcceptedPlayersController() {
    var ctrl = new Controller(this);
    this.getGameAcceptedPlayers = function(packet) {
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
            function(callback) {
                knex.select(['reg_info.user_id',
                             'reg_info.name',
                             'reg_info.last_name',
                             'reg_info.picture',
                             'game_players.game_id'])
                    .from('game_players')
                    .leftJoin('reg_info',
                               'reg_info.user_id',
                               'game_players.user_id')
                    .where({game_id: data.GameID})
                    .then(function(results) {
                        var response = [];
                        for (var ii = 0; ii < results.length; ++ii) {
                            var r = results[ii];
                            var player = {
                                UserID: r.user_id,
                                FirstName: r.name,
                                LastName: r.last_name,
                                PictureURL: r.picture
                            };
                            response.push(player);
                        }
                        return callback(null, {
                            success: 0,
                            Description: null,
                            Players: response
                        });
                    })
                    .catch(function(err) {
                        ctrl.errorCallback(callback, 1, 'Unknown Error');
                    });

            }
        ], ctrl.asyncCallback(deferred));

        return deferred.promise;
    };
}

module.exports = new GetGameAcceptedPlayersController();
