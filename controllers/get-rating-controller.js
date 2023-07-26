var knex = require('lib/knex');
var q = require('q');
var async = require('async');
var util = require('util');
var validator = require('node-validator');
var log = require('helpers/logger');

var Controller = require('controllers/controller');
var UserFeedback = require('models/user-feedback');

function GetRatingController() {
    var ctrl = new Controller(this);

    this.getRating = function(packet) {
        var data = packet.data;
        var deferred = q.defer();
        async.waterfall([
            // Validate params
            function(callback) {
                var check = validator.isAnyObject()
                    .withRequired('UserID', validator.isInteger());
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
                var parseFeedbackResults = function(results) {
                    if (results.length == 0) {
                        return ctrl.errorCallback(callback, 1, "No feedback found");
                    }
                    var average = (results[0].passing
                                   + results[0].shooting
                                   + results[0].fitness
                                   + results[0].reliability)/4;
                    var response = {
                        PictureURL:      results[0].picture,
                        FirstName:       results[0].name,
                        LastName:        results[0].last_name,
                        Passing:         results[0].passing,
                        Shooting:        results[0].shooting,
                        Fitness:         results[0].fitness,
                        Reliability:     results[0].reliability,
                        AverageRating:   average,
                        FeedbackMessage: results[0].feedback,
                        success: 0,
                        Description: null
                    };
                    callback(null, response);
                };
                var parseSQLErr = function(err) {
                    ctrl.errorCallback(callback, 1,
                                       "An unknown database error " +
                                       "has occurred");
                };
                knex.select(['reg_info.name', 'reg_info.last_name', 'reg_info.picture',
                             'user_feedback.average', 'user_feedback.passing',
                             'user_feedback.feedback', 
                             'user_feedback.shooting', 'user_feedback.reliability',
                             'user_feedback.fitness'])
                    .from('reg_info')
                    .innerJoin('user_feedback', 'user_feedback.from_user_id', 'reg_info.user_id')
                    .where({
                        'reg_info.user_id': data.UserID,
                        'user_feedback.profile_user_id': packet.userID
                    })
                    .then(parseFeedbackResults, parseSQLErr);
            },
        ], ctrl.asyncCallback(deferred));
        return deferred.promise;
    };

    return this;
}

module.exports = new GetRatingController();
