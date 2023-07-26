"use strict";

var knex = require('lib/knex'),
  q = require('q'),
  async = require('async'),
  config = require('config'),
  util = require('util'),
  validate = require("validate.js");

var Controller = require('controllers/controller');

function SearchController() {

  var ctrl = new Controller(this);

  this.globalSearch = function(request, response, app) {
    var data = request.data;
    var response = {};
    var deferred = q.defer();

    var globalSearchRequestConstraints = {
      Term: {
        presence: {
          message: "is required"
        }
      },
      Type: {
        presence: {
          message: "is required"
        }
      },
    };

    response.Results = [];

    async.waterfall([

      // Data validation...
      function(callback) {
        var errors = validate(data, globalSearchRequestConstraints);
        if (errors) {
            return callback(errors);
          return ctrl.errorCallback(callback, 1, "Invalid Parameters", errors);
        }
        return callback(null);
      },

      // Get the users
      function(callback) {

        if(data.Type !== 'all' && data.Type !== 'player') {
          return callback(null);
        }

        var searchTerm = '%' + data.Term + '%';
        var followedByCurrentUser = 
          knex.raw('SELECT 1 FROM user_followers WHERE user_id = user.ID AND follower_id = ?', [request.userID])
            .wrap('IFNULL((', '), 0) as followed_by_current_user');

        var avgFeedbackSubQuery = " SELECT "
                                + "   uf.profile_user_id as user_id,"
                                + "   AVG(uf.reliability) as reliability "
                                + " FROM user_feedback uf GROUP BY uf.profile_user_id";

        knex.select([
            'id as user_id',
            'email as user_email',
            'reg_info.name as first_name',
            'reg_info.last_name as last_name',
            'reg_info.picture as picture_url',
            'user_chat_sessions.chat_user_id as chat_user_id',
            'user_location.lat as latitude',
            'user_location.lon as longitude',
            'user_location.locality as locality',
            'user_location.country as country',
            knex.raw("IFNULL(avgfeedback.reliability, 0) as average_reliability"),
            followedByCurrentUser
          ])
          .from('user')
          .innerJoin('reg_info', 'user.id', 'reg_info.user_id')
          .innerJoin('user_chat_sessions', 'user.id', 'user_chat_sessions.user_id')
          .innerJoin('user_location', 'user.id', 'user_location.user_id')
          .innerJoin('user_settings', 'user.id', 'user_settings.user_id')
          .joinRaw('LEFT JOIN (' + avgFeedbackSubQuery + ') avgfeedback ON avgfeedback.user_id = user.ID')
          .whereRaw('(user.email LIKE ? OR reg_info.last_name LIKE ? OR reg_info.name LIKE ? OR CONCAT(reg_info.name, \' \', reg_info.last_name) LIKE ? ) AND user_settings.searchable = TRUE', [searchTerm, searchTerm, searchTerm, searchTerm])
          .then(function(results) {
            for(var i = 0; i < results.length; i++) {
              response.Results.push({
                Type: 'Player',
                ID: results[i].user_id,
                Name: results[i].first_name + ' ' + results[i].last_name,
                PictureURL: results[i].picture_url,
                ChatUserID: results[i].chat_user_id,
                Latitude: results[i].latitude,
                Longitude: results[i].longitude,
                Locality: results[i].locality,
                Country: results[i].country,
                AverageReliability: results[i].average_reliability,
                FollowedByCurrentUser: results[i].followed_by_current_user === 1,
              });
            }

            return callback(null);
          }, function(err) {
            console.log(err);
            return ctrl.errorCallback(callback, 1, "Could not search for players.", err);
          });

      },


      // Get the teams
      function(callback) {

        if(data.Type !== 'all' && data.Type !== 'team') {
          return callback(null);
        }

        var searchTerm = '%' + data.Term + '%';
        knex.select([
            'teams.id as team_id',
            'teams.name as team_name',
            'teams.picture as team_picture',
            'teams.lat as latitude',
            'teams.lon as longitude',
          ])
          .from('teams')
          .where(function() {
            this.where('teams.name', 'like', searchTerm);
          })
          .whereNull('teams.deleted_at')
          .then(function(results) {
            
            for(var i = 0; i < results.length; i++) {
              response.Results.push({
                Type: 'Team',
                ID: results[i].team_id,
                Name: results[i].team_name,
                PictureURL: results[i].team_picture,
                ChatUserID: null,
                Latitude: results[i].latitude,
                Longitude: results[i].longitude,
                Locality: null,
                Country: null,
              });
            }

            return callback(null);
          }, function(err) {
            console.log(err);
            return ctrl.errorCallback(callback, 1, "Could not search for teams.", err);
          });

      },

      // Returns the response..
      function(callback) {
        return callback(null, response);
      },

    ], ctrl.asyncCallback(deferred));

    return deferred.promise;

  }

}

module.exports = new SearchController();
