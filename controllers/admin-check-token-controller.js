"use strict";

/* jshint esversion: 6 */

let knex = require('lib/knex');
let async = require('async');
let q = require('q');
let Controller = require('controllers/controller');
let validate = require("validate.js");
let admin = require('services/admin');
let config = require('config');
let suid = require('rand-token').suid;

let requestConstraints = {
  AdminToken: {
    presence: {
      message: "is required"
    }
  }
};

function AdminCheckTokenController() {
  let ctrl = new Controller(this);

  /** Checks whether or not the admin token given is valid */
  this.checkToken = function(packet) {
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

      // Validate admin token
      function(callback) {
        admin.validateAdminToken(data.AdminToken)
          .then(function() {
            return callback(null, {
              Success: 0,
              Description: null,
              IsValid: true,
            });
          })
          .catch(function(err) {
            return callback(null, {
              Success: 0,
              Description: null,
              IsValid: false,
            });
          });
      }], ctrl.asyncCallback(deferred));
    return deferred.promise;
  }
}

module.exports = new AdminCheckTokenController();





