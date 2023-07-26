"use strict";

/* jshint esversion: 6 */

let knex = require('lib/knex');
let async = require('async');
let q = require('q');
let Controller = require('controllers/controller');
let validate = require("validate.js");
let admin = require('services/admin');
var config = require('config');
var suid = require('rand-token').suid;

let requestConstraints = {
  VendorID: {
    presence: {
      message: "is required"
    }
  },
  Title: {
    presence: {
      message: "is required"
    }
  },
  Body: {
    presence: {
      message: "is required"
    }
  },
  TimePosted: {
    presence: {
      message: "is required"
    }
  },
  Picture: {
    presence: {
      message: "is required"
    }
  },
  AdminToken: {
    presence: {
      message: "is required"
    }
  }
};


function CreateVendorController() {
  let ctrl = new Controller(this);

  /** Gets recent articles, all the way back to the given cutoff timestamp */
  this.createArticle = function(packet) {
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
            return callback(null);
          })
          .catch(function(err) {
            console.log(err);
            return ctrl.errorCallback(callback, 2, 
              "Unauthorised", err);
          });
      },

      // Create image...
      function(callback) {
        let fs                  = require('fs');
        let img                 = data.Picture;
        let sanitizedImageData  = img.replace(/^data:image\/\w+;base64,/, "");
        let buf                 = new Buffer(sanitizedImageData, 'base64');
        let filename            = suid(32) + '.jpg';

        fs.writeFile('public/Article/Picture/' + filename, buf, function(err) {
          if (err) {
            console.log(err);
            return ctrl.errorCallback(callback, 1, 
              "Error writing picture to fs", err);
          }
          let url = config.baseUrl + 'Article/Picture' + filename;
          callback(null, url);
        });
      },

      // Insert into DB
      function(url, callback) {
        knex('article').insert({
          vendor_id: data.VendorID,
          time_posted: data.TimePosted,
          title: data.Title,
          picture: url,
          article_body: data.Body,
        })
          .then(function() {
            return callback(null, {Success: 0, Description: null});
          })
          .catch(function(err) {
            console.log(err);
            return ctrl.errorCallback(callback, 1, 
              "Error writing data to DB", err);
          });
      }
    ], ctrl.asyncCallback(deferred));
    return deferred.promise;
  }
}

module.exports = new CreateVendorController();




