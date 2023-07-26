"use strict";

/* jshint esversion: 6 */

let knex = require('lib/knex');
let async = require('async');
let q = require('q');
let Controller = require('controllers/controller');
let validate = require("validate.js");
let admin = require('services/admin');
var config = require('config');

let requestConstraints = {
  ArticleID: {
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


function DeleteArticleController() {
  let ctrl = new Controller(this);

  /** Gets recent articles, all the way back to the given cutoff timestamp */
  this.deleteArticle = function(packet) {
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

      // Delete from DB
      function(callback) {
        knex('article').del().where('id', data.ArticleID)
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

module.exports = new DeleteArticleController();





