var knex = require('lib/knex'),
    q = require('q'),
    config = require('config'),
    async = require('async'),
    util = require('util'),
    validator = require('node-validator'),
    validate = require("validate.js"),
    log = require('helpers/logger'),
    urlFixer = require('helpers/url-fixer');

var Controller = require('controllers/controller');
var UserService = require('services/user-service');

var requestConstraints = {
  UserID: {
    presence: {
      message: "is required"
    }
  },
};

function GetProfileController() {
  var ctrl = new Controller(this);
  this.getProfile = function(packet) {
    var data = packet.data;
    var deferred = q.defer();
    var distance = 20;

    async.waterfall([
      function(callback) {
        var errors = validate(data, requestConstraints);

        if (!errors) {
          return callback(null);
        }

        return ctrl.errorCallback(callback, 1, "Invalid Parameters", errors);

      },
      function(callback) {

        var alreadyRatedColumn =
            knex.raw('SELECT 1 FROM user_feedback WHERE profile_user_id = user.ID AND from_user_id = ?', [packet.userID])
            .wrap('IFNULL((', '), 0) as AlreadyRated');

        var blockedUser =
          knex.raw('SELECT 1 FROM blocked_users WHERE (user_id = user.ID AND other_user_id = ?) OR (user_id = ? AND other_user_id = user.ID)' , [packet.userID, packet.userID])
          .wrap('IFNULL((', '), 0) as BlockedUser');

        var followedByCurrentUser = 
          knex.raw('SELECT 1 FROM user_followers WHERE user_id = user.ID AND follower_id = ?', [packet.userID])
            .wrap('IFNULL((', '), 0) as followed_by_current_user');

        var avgFeedbackSubQuery = " SELECT "
                                + "   uf.profile_user_id as user_id, AVG(uf.average) as rating, "
                                + "   AVG(uf.passing) as passing, "
                                + "   AVG(uf.shooting) as shooting, "
                                + "   AVG(uf.fitness) as fitness, "
                                + "   AVG(uf.reliability) as reliability "
                                + " FROM user_feedback uf "
                                + " WHERE uf.profile_user_id = ? ";
        knex.select([
          knex.raw("user.ID as UserID"),
          knex.raw("user.email as Email"),
          knex.raw("user.age as Age"),
          knex.raw("user.gender as Gender"),
          knex.raw("reg_info.name as FirstName"),
          knex.raw("reg_info.last_name as LastName"),
          knex.raw("reg_info.birthday as Birthday"),
          knex.raw("reg_info.picture as PictureURL"),
          knex.raw("reg_info.cover_picture as CoverPictureURL"),
          knex.raw("user_chat_sessions.chat_user_id as ChatUserID"),
          knex.raw("IFNULL(avgfeedback.fitness, 0) as AverageFitness"),
          knex.raw("IFNULL(avgfeedback.passing, 0) as AveragePassing"),
          knex.raw("IFNULL(avgfeedback.rating, 0) as AverageRating"),
          knex.raw("IFNULL(avgfeedback.shooting, 0) as AverageShooting"),
          knex.raw("IFNULL(avgfeedback.reliability, 0) as AverageReliability"),
          knex.raw("IFNULL(user_settings.comments, 0) as CommentsAllowed"),
          knex.raw("user_location.lon as Lon"),
          knex.raw("user_location.lat as Lat"),
          knex.raw("user_location.locality as Locality"),
          knex.raw("user_location.country as Country"),
          alreadyRatedColumn,
          blockedUser,
          followedByCurrentUser
        ])
          .from('user')
          .innerJoin('reg_info', 'user.ID', 'reg_info.user_id')
          .innerJoin('user_location', 'user.ID', 'user_location.user_id')
          .leftJoin('user_chat_sessions', 'user.ID', 'user_chat_sessions.user_id')
          .leftJoin('user_settings', 'user.ID', 'user_settings.user_id')
          .joinRaw('LEFT JOIN (' + avgFeedbackSubQuery + ') avgfeedback ON avgfeedback.user_id = user.ID', data.UserID)
          .where('user.ID', data.UserID)
          .orderBy('user.id', 'asc')
          .then(function(result) {
            if (result.length === 0) {
              return ctrl.errorCallback(callback, 1, "User not found");
            }

            // console.log('results', result);
            
            // Sanitize results...
            var r = {
              UserID: result[0].UserID, 
              ChatUserID: result[0].ChatUserID, 
              FirstName: result[0].FirstName,
              LastName: result[0].LastName,
              Age: result[0].Age,
              Email: result[0].Email,
              Gender: result[0].Gender,
              Birthday: result[0].Birthday,
              PictureURL: result[0].PictureURL,
              CoverPictureURL: result[0].CoverPictureURL,
              AverageFitness: result[0].AverageFitness,
              AveragePassing: result[0].AveragePassing,
              AverageRating: result[0].AverageRating,
              AverageShooting: result[0].AverageShooting,
              AverageReliability: result[0].AverageReliability,
              CommentsAllowed: Boolean(result[0].CommentsAllowed),
              AlreadyRated: Boolean(result[0].AlreadyRated),
              Lon: result[0].Lon,
              Lat: result[0].Lat,
              Locality: result[0].Locality,
              Country: result[0].Country,
              BlockedUser: result[0].BlockedUser === 1,
              FollowedByCurrentUser: result[0].followed_by_current_user === 1,
            };

            if(r.PictureURL) {
              r.PictureURL = urlFixer(r.PictureURL);
            }
            
            if(r.CoverPictureURL) {
              r.CoverPictureURL = urlFixer(r.CoverPictureURL);
            }

            // console.log('results final', r);

            return callback(null, r);
          })
          .catch(function(err) {
            console.log(err);
            return ctrl.errorCallback(callback, 1, "Unknown error");
          });
      },
      function(result, callback) {
        result.Feedbacks = [];

        knex.select([
          knex.raw("name as fromFirstName"),
          knex.raw("last_name as fromLastName"),
          knex.raw("from_user_id as fromID"),
          knex.raw("passing"),
          knex.raw("shooting"),
          knex.raw("fitness"),
          knex.raw("reliability"),
          knex.raw("average"),
          knex.raw("feedback"),
          knex.raw("time_sent as timestamp")
        ])
          .from('user_feedback')
          .innerJoin('user', 'user.id', 'user_feedback.from_user_id')
          .innerJoin('reg_info', 'reg_info.user_id', 'user.id')
          .where('user_feedback.profile_user_id', data.UserID)
          .then(function(feedbacks) {
            result.Feedbacks = feedbacks;
            return callback(null, result);
          })
          .catch(function(err) {
            console.log(err);
            return ctrl.errorCallback(callback, 1, "Unknown error");
          });
      },
      function(result, callback) {
        result.Positions = [];

        knex.select([
          knex.raw("positions.id as PositionID"),
          knex.raw("positions.name as Name"),
          knex.raw("positions.short_name as ShortName")
        ])
          .from('player_positions')
          .innerJoin('positions', 'positions.id', 'player_positions.position_id')
          .where('player_positions.user_id', result.UserID)
          .then(function(positions) {
            result.Positions = positions;
            return callback(null, result);
          })
          .catch(function(err) {
            console.log(err);
            return ctrl.errorCallback(callback, 1, "Unknown error");
          });
      },
      // Check if already rated
      function(result, callback) {
        var userLocation = {
          'lat': result.Lat, 
          'lon': result.Lon, 
        };

        UserService
          .getUserAverageRating(data.UserID)
          .then(function(userAverageRating){
            if (!userAverageRating || (userAverageRating && userAverageRating.rating === -1)) {
              result.UserRanking = 0;
              return callback(null, result);
            }

            UserService
              .getUsersBetterRatedByDistance(result.AverageRating, distance, userLocation)
              .then(function(userRankings){
                var rank = 0;
                for (var k in userRankings) {
                  if (userRankings[k].id != data.UserID) {
                    continue;
                  }

                  rank = k;
                }

                result.UserRanking = parseInt(rank) + 1;
                return callback(null, result);
              })
              .catch(function(err){
                console.log(err);
                return ctr.errorCallback(callback, 1, "Error while retrieving user regional ranking.");
              })
          })
          .catch(function(err){
            console.log(err);
            return ctr.errorCallback(callback, 1, "Error while retrieving user average rating.");
          })
      },

    ], ctrl.asyncCallback(deferred));
    return deferred.promise;
  };
}

module.exports = new GetProfileController();
