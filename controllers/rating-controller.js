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
                        return callback(null)
                    }
                    log.error(errors);
                    return ctrl.errorCallback(callback, 1,
                                              "Invalid Parameters");
                });
            },

            function(callback) {
                var parseFeedbackModel = function(model) {
                    var average = (model.passing
                                   + model.shooting
                                   + model.fitness
                                   + model.reliability)/4;
                    var response = {
                        PictureURL:      model.picture,
                        FirstName:       model.name,
                        LastName:        model.last_name,
                        Passing:         model.passing,
                        Shooting:        model.shooting,
                        Fitness:         model.fitness,
                        Reliability:     model.reliability,
                        AverageRating:   average,
                        FeedbackMessage: model.feedback,
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
                             'user_feedback.shooting', 'user_feedback.reliability',
                             'user_feedback.fitness'])
                    .from('reg_info')
                    .innerJoin('user_feedback', 'user_feedback.from_user_id', 'reg_info.user_id')
                    .where({
                        'reg_info.user_id': data.UserID,
                        'user_feedback.profile_user_id': packet.userID
                    })
                    .then(parseFeedbackModel, parseSQLErr);
            },
        ], ctrl.asyncCallback(deferred));
        return deferred.promise;
    };

    return this;
}

module.exports = new GetRatingController();

