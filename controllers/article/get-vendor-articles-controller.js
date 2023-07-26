"use strict";

/* jshint esversion: 6 */

let knex = require('lib/knex');
let q = require('q');
let async = require('async');
let Controller = require('controllers/controller');
let validate = require("validate.js");

let requestConstraints = {
  VendorID: {
    presence: {
      message: "is required"
    }
  },
};


function GetVendorArticlesController() {
  let ctrl = new Controller(this);

  /** Simple function to select all of a vendor's articles and return the
   * IDs in a JSON Array */
  this.getVendorArticles = function(packet) {
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

      // Select all vendor IDs
      function(callback) {
        knex('article').select(['id', 'vendor_id'])
          .where('vendor_id', data.VendorID)
          .then(function(results) {
            let ret = {
              Success: 0,
              Description: null,
              Articles: [],
            }
            for (let ii = 0; ii < results.length; ++ii) {
              ret.Articles.push(results[ii].id);
            }
            return callback(null, ret);
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

module.exports = new GetVendorArticlesController();

