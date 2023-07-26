"use strict";

/* jshint esversion: 6 */

let knex = require('lib/knex');
let q = require('q');
let async = require('async');
let Controller = require('controllers/controller');

function GetVendorsController() {
  let ctrl = new Controller(this);

  /** Simple function to select all vendors and their data, and return it
  * in a JSON Array */
  this.getVendors = function(packet) {
    let data = packet.data;
    let deferred = q.defer();
    async.waterfall([
      // Select list of all vendors and their info
      function(callback) {
        knex('article_vendors').select('*')
          .then(function(result) {
            let ret = {
              Success: 0,
              Description: null,
              Vendors: [],
            };
            console.log("Hey");
            for (let ii = 0; ii < result.length; ++ii) {
              console.log("Hey");
              ret.Vendors.push({
                VendorID: result[ii].id,
                VendorName: result[ii].name,
                VendorPictureURL: result[ii].picture,
              });
            }
            console.log("Ret");
            callback(null, ret);
          })
          .catch(function(err) {
            return ctrl.errorCallback(callback, 
              1, "Database error #0", err);
          });
      }
    ], ctrl.asyncCallback(deferred));
    return deferred.promise;
  }
}

module.exports = new GetVendorsController();
