"use strict";

/* jshint esversion: 6 */

var knex = require('lib/knex');
class RatingsService {
    static hasUserBeenRatedBy(userID, ratedByUserID) {
      return new Promise(function(resolve, reject) {
        knex('user_feedback')
          .where({
            'profile_user_id': userID,
            'from_user_id': ratedByUserID
          }).then(function(results) {
            if (results.length) {
              return resolve(true);
            }
            return resolve(false);
          }, function(error) {
              return resolve(false);
          });
      });

    }
}

module.exports = RatingsService;