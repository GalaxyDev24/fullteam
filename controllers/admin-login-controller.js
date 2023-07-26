"use strict";

/* jshint esversion: 6 */

let knex = require('lib/knex');
let async = require('async');
let q = require('q');
let Controller = require('controllers/controller');
let validate = require("validate.js");
let admin = require('services/admin');


let requestConstraints = {
  Pass: {
    presence: {
      message: "is required"
    }
  },
};

const ADMIN_PASSWORD = "akjs02kslkdmAKjsajs";

function AdminLoginController() {
  let ctrl = new Controller(this);

  /** Gets recent articles, all the way back to the given cutoff timestamp */
  this.adminLogin = function(packet) {
    let data = packet.data;
    let deferred = q.defer();
    async.waterfall([

      // Validate params
      function(callback) {
        let errors = validate(data, requestConstraints);
        if (!errors) {
          return callback(null);
        }
        return ctrl.errorCallback(callback, 1, 
          "Invalid Parameters", errors);
      },

      // Validate password 
      function(callback) {
        if (data.Pass === ADMIN_PASSWORD) {
          callback(null);
        }
        else {
          return ctrl.errorCallback(callback, 2, 
            "Password Incorrect");
        }
      },

      // Insert into DB
      function(callback) {
        const TIME_VALID = 3600000; // 1 hour
        require('crypto').randomBytes(64, function(err, buffer) {
          if (err) {
            return ctrl.errorCallback(callback, 1, 
              "Err generating random token", err);
          }
          let token = buffer.toString('hex');
          knex('admin_token').insert({
            token: token,
            valid_until: (new Date()).getTime() + TIME_VALID,
          })
            .then(function() {
              return callback(null, {Success: 0, Description: null, Token: token});
            })
            .catch(function(err) {
              return ctrl.errorCallback(callback, 1, 
                "Error writing data to DB", err);
            });
        });
      }
    ], ctrl.asyncCallback(deferred));
    return deferred.promise;
  }
}

module.exports = new AdminLoginController();




