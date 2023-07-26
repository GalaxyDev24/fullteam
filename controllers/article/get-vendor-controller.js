"use strict";

/* jshint esversion: 6 */

let knex = require('lib/knex');
let async = require('async');
let q = require('q');
let Controller = require('controllers/controller');
let validate = require("validate.js");

let requestConstraints = {
  VendorID: {
    presence: {
      message: "is required"
    }
  },
};


function GetVendorController() {
  let ctrl = new Controller(this);

  /** Gets the vendor info given a vendor ID */
  this.getVendor = function(packet) {
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

      // Select the article
      function(callback) {
        knex('article_vendors').select(['*'])
          .where('id', data.VendorID)
          .then(function(results) {
            if (results.length <= 0) {
              return ctrl.errorCallback(callback, 2, 
                "No vendor found");
            }

            let r = results[0];
            return callback(null, {
              Success: 0,
              Description: null,
              Vendor: {
                VendorName: r.name,
                VendorPictureURL: r.picture,
              }
            });
          })
          .catch(function(err) {
            return ctrl.errorCallback(callback, 1, 
              "Database Error #0", err);
          });
      },
    ], ctrl.asyncCallback(deferred));
    return deferred.promise;
  }
}

module.exports = new GetVendorController();



