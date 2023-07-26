"use strict";

/* jshint esversion: 6 */

let articleService = require('services/article-service');
let knex = require('lib/knex');
let async = require('async');
let q = require('q');
let Controller = require('controllers/controller');
let validate = require("validate.js");

let requestConstraints = {
  Cutoff: {
    presence: {
      message: "is required"
    }
  },
};


function GetRecentArticlesController() {
  let ctrl = new Controller(this);

  /** Gets recent articles, all the way back to the given cutoff timestamp */
  this.getRecentArticles = function(packet) {
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

      // Get all recent articles and return the data
      function(callback) {
        articleService.getRecentArticlesTimeCutoff(data.Cutoff)
          .then(function(res) {
            callback(null, res);
          })
          .catch(function(err) {
            console.log(err);
            return ctrl.errorCallback(callback, 1, 
              "Invalid Parameters", errors);
          });
      },
    ], ctrl.asyncCallback(deferred));
    return deferred.promise;
  }
}

module.exports = new GetRecentArticlesController();


