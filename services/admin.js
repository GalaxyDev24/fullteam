"use strict";

/* jshint esversion: 6 */

let q = require('q');
let knex = require('lib/knex');

/** Validates and admin token, returns true if admin token is currently
 * valid, false otherwise. */
function validateAdminToken(token) {
  var deferred = q.defer();
  knex('admin_token').select('*')
    .where('token', token)
    .andWhere('valid_until', '>', (new Date()).getTime())
    .then(function(res) {
      if (res.length <= 0) {
        deferred.reject("Unauthorised");
      }
      else {
        deferred.resolve();
      }
    })
    .catch(function(err) {
      deferred.reject(err);
    });
  return deferred.promise;
}

module.exports = {
  validateAdminToken: validateAdminToken,
};
