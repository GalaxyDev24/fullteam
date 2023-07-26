"use strict";

/* jshint esversion: 6 */

let knex = require('lib/knex');
let async = require('async');
let q = require('q');
let Controller = require('controllers/controller');
let validate = require("validate.js");

let requestConstraints = {
  ArticleID: {
    presence: {
      message: "is required"
    }
  },
};


function GetArticleController() {
  let ctrl = new Controller(this);

  /** Gets the article info given an article ID. */
  this.getArticle = function(packet) {
    let data = packet.data;
    let deferred = q.defer();
    async.waterfall([

      // Validate params
      function(callback) {
        console.log("Data: " + JSON.stringify(data));
        let errors = validate(data, requestConstraints);
        if (!errors) {
          return callback(null);
        }
        return ctrl.errorCallback(callback, 1, 
          "Invalid Parameters", errors);
      },

      // Select the article
      function(callback) {
        knex('article').select(['*'])
          .where('id', data.ArticleID)
          .then(function(results) {
            if (results.length <= 0) {
              return ctrl.errorCallback(callback, 2, 
                "No article found");
            }

            let r = results[0];
            return callback(null, {
              Success: 0,
              Description: null,
              Article: {
                VendorID: r.vendor_id,
                Title: r.title,
                PictureURL: r.picture,
                TimePosted: r.time_posted,
                Body: r.article_body,
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

module.exports = new GetArticleController();


