"use strict";

/* jshint esversion: 6 */

let knex = require('lib/knex');
let async = require('async');
let q = require('q');
let Controller = require('controllers/controller');
let validator = require('node-validator');
let admin = require('services/admin');
var config = require('config');
var suid = require('rand-token').suid;

function EditVendorController() {
  let ctrl = new Controller(this);

  /** Gets recent articles, all the way back to the given cutoff timestamp */
  this.editVendor = function(packet) {
    console.log("hello, world!");
    let data = packet.data;
    let deferred = q.defer();
    async.waterfall([

      // Validate params
      function(callback) {
        console.log(data);
        var check = validator.isAnyObject()
          .withRequired('VendorID', validator.isInteger())
          .withRequired('AdminToken', validator.isString())
          .withOptional('Name', validator.isString())
          .withOptional('Picture', validator.isString());
        validator.run(check, data, function(errCount, errors) {
          if (!errCount) {
            return callback(null);
          }
          return ctrl.errorCallback(callback, 1, "Invalid Parameters");
        });
      },

      // Validate admin token
      function(callback) {
        admin.validateAdminToken(data.AdminToken)
          .then(function() {
            return callback(null);
          })
          .catch(function(err) {
            return ctrl.errorCallback(callback, 2, 
              "Unauthorised", err);
          });
      },

      // Edit image...
      function(callback) {
        if (typeof data.Picture === 'undefined') {
          console.log("Picture undefined");
          return callback(null, undefined);
        }
        console.log("Picture defined");
        let fs                  = require('fs');
        let img                 = data.Picture;
        let sanitizedImageData  = img.replace(/^data:image\/\w+;base64,/, "");
        let buf                 = new Buffer(sanitizedImageData, 'base64');
        let filename            = suid(32) + '.jpg';

        console.log("Hey");
        fs.writeFile('public/Article/Picture/' + filename, buf, function(err) {
          if (err) {
            console.log("err");
            return ctrl.errorCallback(callback, 1, 
              "Error writing picture to fs", err);
          }
          let url = config.baseUrl + 'Article/Picture' + filename;
          console.log("Hey");
          callback(null, url);
        });
      },

      // Insert into DB
      function(url, callback) {
        let insertData = {};
        if (typeof url !== 'undefined') { insertData.picture = url; }
        if (typeof data.Name !== 'undefined') { insertData.name = data.Name; }

        console.log(insertData);

        let isEmpty = true;
        for (let key in insertData) {
          if (hasOwnProperty.call(insertData, key)) { isEmpty = false; }
        }
        if (isEmpty) {
          return callback(null, {Success: 0, Description: null});
        }

        console.log("Hey");
        knex('article_vendors').update(insertData)
          .where('id', data.VendorID)
          .then(function() {
            console.log("Hey");
            return callback(null, {Success: 0, Description: null});
          })
          .catch(function(err) {
            return ctrl.errorCallback(callback, 1, 
              "Error writing data to DB", err);
          });
      }
    ], ctrl.asyncCallback(deferred));
    return deferred.promise;
  }
}

module.exports = new EditVendorController();




