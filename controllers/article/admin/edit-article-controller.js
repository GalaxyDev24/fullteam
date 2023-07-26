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

function EditArticleController() {
  let ctrl = new Controller(this);

  /** Gets recent articles, all the way back to the given cutoff timestamp */
  this.editArticle = function(packet) {
    let data = packet.data;
    let deferred = q.defer();
    async.waterfall([

      // Validate params
      function(callback) {
        var check = validator.isAnyObject()
          .withRequired('ArticleID', validator.isInteger())
          .withRequired('AdminToken', validator.isString())
          .withOptional('VendorID', validator.isInteger())
          .withOptional('TimePosted', validator.isInteger())
          .withOptional('Title', validator.isString())
          .withOptional('Body', validator.isString())
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
            console.log(err);
            return ctrl.errorCallback(callback, 2, 
              "Unauthorised", err);
          });
      },

      // Edit image...
      function(callback) {
        if (typeof data.Picture === 'undefined') {
          return callback(null, undefined);
        }
        let fs                  = require('fs');
        let img                 = data.Picture;
        let sanitizedImageData  = img.replace(/^data:image\/\w+;base64,/, "");
        let buf                 = new Buffer(sanitizedImageData, 'base64');
        let filename            = suid(32) + '.jpg';

        fs.writeFile('public/Article/Picture/' + filename, buf, function(err) {
          if (err) {
            return ctrl.errorCallback(callback, 1, 
              "Error writing picture to fs", err);
          }
          let url = config.baseUrl + 'Article/Picture' + filename;
          callback(null, url);
        });
      },

      // Insert into DB
      function(url, callback) {
        let insertData = {};
        if (typeof url !== 'undefined') { insertData.picture = url; }
        if (typeof data.Title !== 'undefined') { 
          insertData.title = data.Title; 
        }
        if (typeof data.Body !== 'undefined') { 
          insertData.article_body = data.Body; 
        }
        if (typeof data.TimePosted !== 'undefined') { 
          insertData.time_posted = data.TimePosted; 
        }
        if (typeof data.VendorID !== 'undefined') { 
          insertData.vendor_id = data.VendorID; 
        }
        let isEmpty = true;
        for (let key in insertData) {
          if (hasOwnProperty.call(insertData, key)) { isEmpty = false; }
        }
        if (isEmpty) {
          return callback(null, {Success: 0, Description: null});
        }

        knex('article').update(insertData)
          .where('id', data.ArticleID)
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

module.exports = new EditArticleController();





