var knex = require('lib/knex');
var q = require('q');
var async = require('async');
var util = require('util');
var validator = require('node-validator');
var log = require('helpers/logger');
var app = require('lib/application');
var urlFixer = require('helpers/url-fixer');
var User = require('models/user');
var UserLocation = require('models/user-location');
var Controller = require('controllers/controller');
var parseSearchResultsFunction = require('controllers/search-player-controller/common.js');

var ctrl = new Controller(this);

module.exports = function(packet) {
  var data = packet.data;
  var deferred = q.defer();
  async.waterfall([
    function(callback) {
      var check = validator.isAnyObject()
        .withRequired('Name', validator.isString());
      validator.run(check, data, function(errCount, errors) {
        if (!errCount) {
          return callback(null);
        }
        log.error(errors);
        return ctrl.errorCallback(callback, 1, "Invalid parameters");
      });
    },
    function(callback) {
      var userID = packet.userID;
      var selectLocCallback = function(model) {
        var numResults = 10;
        var words = data.Name.split(" ");
        var sql ="SELECT ri.name, ri.last_name, ri.user_id, u.id, " +
          "ri.picture, u.last_active, pp.position_id, " +
          "u.online, ul.lat, ul.lon, uf.rating, u.age, " +
          "ub.user_id, ub.other_user_id, " +
          "ul.distance, ucs.chat_user_id FROM user u INNER JOIN reg_info " +
          "ri ON ri.user_id = u.id  " + 
          " LEFT JOIN user_chat_sessions ucs ON ucs.user_id = u.id " + 
          " LEFT JOIN blocked_users ub ON " +
          "  ub.user_id = u.id OR ub.other_user_id = u.id" +
          " LEFT JOIN player_positions pp ON pp.user_id = u.id " +
          " LEFT JOIN (SELECT " +
          "profile_user_id, AVG(average) AS rating FROM " +
          "user_feedback GROUP BY profile_user_id) AS uf " +
          "on uf.profile_user_id = u.id INNER JOIN " +
          "(SELECT lat, lon, GETDISTANCE(lat, lon, ?, ?) " +
          "AS distance, user_id FROM user_location) AS " +
          "ul ON ul.user_id = u.id WHERE (";
        for (var ii = 0; ii < words.length; ++ii) {
          if (ii == words.length - 1) {
            sql += "ri.name LIKE ? OR ri.last_name LIKE ? ";
          }
          else {
            sql += "ri.name LIKE ? OR ri.last_name LIKE ? OR ";
          }
        }
        sql += ") AND " +
          "(ub.user_id is NULL OR " +
          "!((ub.user_id = u.id AND ub.other_user_id = ?) OR " +
          "  (ub.other_user_id = u.id AND ub.user_id = ?))) " +
          "  GROUP BY ri.user_id " +
          " ORDER BY ri.name LIKE ? DESC, ul.distance ASC LIMIT " + numResults;
        // "ORDER BY ul.distance ASC LIMIT " + numResults;
        // Modify words array to be double itself, i.e [word0,
        // word0, word1, word1 ...]  rather than [word0,
        // word1, ...]
        // This is so we can add them as prepared parameters
        // in the knex.raw command.
        // First 2 attributes need to be lat/lon
        var doubleWords = [model.attributes.lat, model.attributes.lon];
        // Probs not the most efficient method here.
        for (var ii = 0; ii < words.length; ++ii) {
          doubleWords.push('%' + words[ii] + '%');
          doubleWords.push('%' + words[ii] + '%');
        }
        doubleWords.push(packet.userID);
        doubleWords.push(packet.userID);
        doubleWords.push('%' + words[0] + '%');
        knex.raw(sql, doubleWords).then(function(results) {
          var users = parseSearchResultsFunction(results);
          callback(null, {
            'success': 0,
            'UserList': users,
            'Description': null
          });
        }, function(err) {
          console.log(err);
          return ctrl.errorCallback(callback, 1, 
            "An unknown database " + 
            "error has occurred");
        });

      };
      new UserLocation({'user_id': userID})
        .fetch()
        .then(selectLocCallback, function(err) {
          callback({
            'success': 1,
            'Description': "An unkown error has occurred " + 
            "whilst searching for players."
          });
        });



    }], ctrl.asyncCallback(deferred));
  return deferred.promise;
}
