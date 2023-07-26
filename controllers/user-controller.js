var knex = require('lib/knex'),
  q = require('q'),
  config = require('config'),
  async = require('async'),
  moment = require('moment'),
  suid = require('rand-token').suid,
  validate = require("validate.js"),
  urlFixer = require('helpers/url-fixer'),
  logger = require('helpers/logger'),
  firebase = require('helpers/firebase');

var Controller = require('controllers/controller');
var NotificationService = require('services/notification-service');
var NewsfeedService = require('services/newsfeed-service');

var singleUserIdRequestConstraints = {
  UserID: {
    presence: {
      message: "is required"
    }
  },
};

function UserController() {
  var ctrl = new Controller(this);

  this.getUserData = function(packet) {
    var data = packet.data;
    var response = {};

    var deferred = q.defer();
    async.waterfall([
      // Get the user
      function(callback) {
        knex.select()
          .from('user')
          .innerJoin('reg_info', 'reg_info.user_id', 'user.id')
          .where('user.id', packet.userID)
          .first()
          .then(function(user) {
            if (typeof user === 'undefined') {
              return ctrl.errorCallback(callback, 1, "User not found");
            }

            if (user.picture) {
              // Temporary fix for old builds of IOS and ANDROID.
              user.picture = urlFixer(user.picture);
            }

            response.Email = user.email;
            response.PictureURL = user.picture;
            if (user.birthday != 0) {
              response.Birthday = user.birthday;
            }

            return callback(null);
          }, function(err) {
            return ctrl.errorCallback(callback, 1, "User does not exist.", err);
          });

      },
      // Returns the response..
      function(callback) {
        return callback(null, response);
      },

    ], ctrl.asyncCallback(deferred));
    return deferred.promise;
  };

  this.updateData = function(packet) {
    var data = packet.data;
    var response = {};
    var updatedUserInfo = {};
    var updatedRegistrationInfo = {};
    var updateDataRequestConstraints = {
      Email: {
        email: true
      },
      Birthday: {
        format: {
          pattern: /\d{4}\d{2}\d{2}/,
          flags: "i",
          message: "should be in the following format: yyyymmdd"
        }
      },
      FirstName: {
        length: {
          minimum: 2
        }
      },
      LastName: {
        length: {
          minimum: 2
        }
      },
    };

    var deferred = q.defer();
    async.waterfall([
      // Data validation...
      function(callback) {
        
        var errors = validate(data, updateDataRequestConstraints);
        if (errors) {
          return ctrl.errorCallback(callback, 1, "Invalid Parameters", errors);
        }

        return callback(null);



      },

      // User exists ?
      function(callback) {
        knex.select()
          .from('user')
          .where('id', packet.userID)
          .first()
          .then(function(user) {
            if (typeof user === 'undefined') {
              return ctrl.errorCallback(callback, 1, "User not found");
            }
            return callback(null);
          }, function(err) {
            return ctrl.errorCallback(callback, 1, "User does not exist.");
          });

      },

      // Update User
      function(callback) {

        // ;
        var updatedUserInfo = {};

        if (data.Email) {
          updatedUserInfo.email = data.Email;
        }

        if (validate.isEmpty(updatedUserInfo)) {
          return callback(null);
        }

        knex('user')
          .where('id', packet.userID)
          .update(updatedUserInfo)
          .then(function() {
            return callback(null);
          }, function(err) {
            return ctrl.errorCallback(callback, 1, "User could not be updated. 2", err);
          });

      },

      function(callback) {

        if (typeof data.Picture === 'undefined') {
          return callback(null);
        }

        if (!data.Picture) {
          return callback(null);
        }

        var fs = require('fs');
        var img = data.Picture;
        var sanitizedImageData = img.replace(/^data:image\/\w+;base64,/, "");
        var buf = new Buffer(sanitizedImageData, 'base64');
        var filename = suid(32) + '.jpg';

        fs.writeFile('public/UserUploads/ProfilePictures/' + filename, buf, function(err) {
          if (err) {
            return callback(err);
          }
          data.PictureURL = config.baseUrl + 'UserUploads/ProfilePictures/' + filename;
          callback(null);
        });

      },


      function(callback) {

        if (typeof data.CoverPicture === 'undefined') {
          return callback(null);
        }

        if (!data.CoverPicture) {
          return callback(null);
        }


        var fs = require('fs');
        var img = data.CoverPicture;
        var sanitizedImageData = img.replace(/^data:image\/\w+;base64,/, "");
        var buf = new Buffer(sanitizedImageData, 'base64');
        var filename = suid(32) + '.jpg';

        fs.writeFile('public/UserUploads/ProfilePictures/' + filename, buf, function(err) {
          if (err) {
            return callback(err);
          }
          data.CoverPictureURL = config.baseUrl + 'UserUploads/ProfilePictures/' + filename;
          callback(null);
        });

      },


      function(callback) {

        if (typeof data.Positions === 'undefined') {
          return callback(null);
        }

        knex('player_positions')
          .where('player_positions.user_id', packet.userID)
          .delete()
          .then(function(teamIDs) {
            // 
            var playerPositions = [];
            for (var i = 0; i < data.Positions.length; i++) {
              playerPositions.push({
                user_id: packet.userID,
                position_id: data.Positions[i].ID
              });
            }

            knex.batchInsert('player_positions', playerPositions, 30).then(function(ids) {
              return callback(null);
            }, function(err) {
              return ctrl.errorCallback(callback, 1, "Error adding player positions", err);
            });

          }, function(err) {
            return ctrl.errorCallback(callback, 1, "Error deleting player positions.", err);
          });
      },

      // Update User
      function(callback) {

        // validate.isEmpty({});
        if (data.Birthday) {
          updatedRegistrationInfo.birthday = data.Birthday;
        }

        if (data.PictureURL) {
          updatedRegistrationInfo.picture = data.PictureURL;
        }

        if (data.CoverPictureURL) {
          updatedRegistrationInfo.cover_picture = data.CoverPictureURL;
        }

        if (data.FirstName) {
          updatedRegistrationInfo.name = data.FirstName;
        }

        if (data.LastName) {
          updatedRegistrationInfo.last_name = data.LastName;
        }

        if (validate.isEmpty(updatedRegistrationInfo)) {
          return callback(null);
        }

        knex('reg_info')
          .where('user_id', packet.userID)
          .update(updatedRegistrationInfo)
          .then(function() {
            return callback(null);
          }, function(err) {
            return ctrl.errorCallback(callback, 1, "Registration info could not be updated. 2", err);
          });

      },

      // Insert data to posts
      function(callback) {
        if (typeof data.Picture === 'undefined' 
          && typeof data.PictureURL === 'undefined' 
          && typeof data.CoverPicture === 'undefined'
          && typeof data.CoverPictureURL === 'undefined') {
          return callback(null);
        }

        var tasks = [];

        if (typeof data.PictureURL !== 'undefined') {
          tasks.push(NewsfeedService.createSystemPost({
            'userID': packet.userID, 
            'postTitle': 'Updated profile picture', 
            'postContent': data.PictureURL, 
            'postType': 'profile picture update',
            'postParentID': packet.userID, 
            'postParentType': 'user', 
            'postMeta': {PictureURL: data.PictureURL}
          }));
        }
        if (typeof data.CoverPictureURL !== 'undefined') {
          tasks.push(NewsfeedService.createSystemPost({
            'userID': packet.userID, 
            'postTitle': 'Updated cover picture', 
            'postContent': data.CoverPictureURL, 
            'postType': 'cover picture update',
            'postParentID': packet.userID, 
            'postParentType': 'user', 
            'postMeta': {PictureURL: data.CoverPictureURL}
          }));
        }

        Promise.all(tasks).then(function() {
          return callback(null);
        }, function(err) {
          console.log(err);
          ctrl.errorCallback(callback, 1, "Error creating post", err);
        });
      },

      // Returns the response..
      function(callback) {
        return callback(null, response);
      },
    ], ctrl.asyncCallback(deferred));
    return deferred.promise;
  };

  this.changeBirthday = function(packet) {
    var data = packet.data;
    var response = {};

    var changeBirthdayRequestConstraints = {
      Birthday: {
        presence: {
          message: "is required"
        },
        format: {
          pattern: /\d{4}\d{2}\d{2}/,
          flags: "i",
          message: "should be in the following format: yyyymmdd"
        }
      },

    };

    var deferred = q.defer();
    async.waterfall([
      // Data validation...
      function(callback) {
        var errors = validate(data, changeBirthdayRequestConstraints);
        if (errors) {
          return ctrl.errorCallback(callback, 1, "Invalid Parameters", errors);
        }

        return callback(null);

      },

      // User exists ?
      function(callback) {
        knex.select()
          .from('user')
          .where('id', packet.userID)
          .first()
          .then(function(user) {
            if (typeof user === 'undefined') {
              return ctrl.errorCallback(callback, 1, "User not found");
            }
            return callback(null);
          }, function(err) {
            return ctrl.errorCallback(callback, 1, "User does not exist.");
          });

      },

      // Update User
      function(callback) {

        var updatedRegistrationInfo = {
          birthday: data.Birthday
        };

        knex('reg_info')
          .where('user_id', packet.userID)
          .update(updatedRegistrationInfo)
          .then(function() {
            return callback(null);
          }, function(err) {
            return ctrl.errorCallback(callback, 1, "Birthday could not be updated.");
          });

      },

      // Returns the response..
      function(callback) {
        return callback(null, response);
      },

    ], ctrl.asyncCallback(deferred));
    return deferred.promise;
  };



  this.addGCMID = function(packet) {
    var data = packet.data;
    var response = {};

    var addCGMIDRequestConstraints = {
      GCMID: {
        presence: {
          message: "is required"
        }
      },
    };

    var deferred = q.defer();
    async.waterfall([
      // Data validation...
      function(callback) {
        var errors = validate(data, addCGMIDRequestConstraints);
        if (errors) {
          return ctrl.errorCallback(callback, 1, "Invalid Parameters", errors);
        }

        return callback(null);

      },

      // User exists ?
      function(callback) {
        knex.select()
          .from('user')
          .where('id', packet.userID)
          .first()
          .then(function(user) {
            if (typeof user === 'undefined') {
              return ctrl.errorCallback(callback, 1, "User not found");
            }
            return callback(null);
          }, function(err) {
            return ctrl.errorCallback(callback, 1, "User does not exist.");
          });
      },

      function(callback) {
        NotificationService.addGCMID(packet.userID, data.GCMID);
        return callback(null);
      },

      // Returns the response..
      function(callback) {
        return callback(null, response);
      },

    ], ctrl.asyncCallback(deferred));
    return deferred.promise;
  };

  this.getFollowers = function(request, response, app) {
    var data = request.data;
    var response = {};
    var currentUser = null;
    var deferred = q.defer();

    async.waterfall([
      // Data validation...
      function(callback) {
        var errors = validate(data, singleUserIdRequestConstraints);
        if (errors) {
          return ctrl.errorCallback(callback, 1, "Invalid Parameters", errors);
        }
        return callback(null);
      },

      function(callback) {
        response.Followers = [];

        knex
          .select([
            'user.id as UserID',
            'reg_info.name as FirstName',
            'reg_info.last_name as LastName',
            'reg_info.picture as PictureURL',
            'user_followers.created_at as CreatedAt',
          ])
          .from('user_followers')
          .innerJoin('user', 'user.id', 'user_followers.follower_id')
          .innerJoin('reg_info', 'user.id', 'reg_info.user_id')
          .where('user_followers.user_id', data.UserID)
          .then(function(followers) {

            if (typeof followers === 'undefined') {
              followers = [];
            }

            response.Followers = followers;

            return callback(null);

          }, function(err) {
            return ctrl.errorCallback(callback, 1, "Could not retrieve follow status.");
          });
      },

      // Returns the response..
      function(callback) {
        return callback(null, response);
      },

    ], ctrl.asyncCallback(deferred));
    return deferred.promise;

  };

  this.getFollowedUsers = function(request, response, app) {
    var data = request.data;
    var response = {};
    var currentUser = null;
    var deferred = q.defer();

    async.waterfall([
      function(callback) {
        response.FollowedUsers = [];

        var timeNow = Date.now();
        knex
          .select([
            'user.id as UserID',
            knex.raw('true as Online'),
            'user.last_active as LastActive',
            'reg_info.name as FirstName',
            'reg_info.last_name as LastName',
            'reg_info.picture as PictureURL',
            'user_chat_sessions.chat_user_id as ChatUserID',
          ])
          .from('user_followers')
          .innerJoin('user', 'user.id', 'user_followers.user_id')
          .innerJoin('reg_info', 'user.id', 'reg_info.user_id')
          .innerJoin('user_chat_sessions', 'user.id', 'user_chat_sessions.user_id')
          .whereRaw('user_followers.follower_id = ? AND last_active > 0 AND (? - user.last_active < 600000)', [request.userID, timeNow])
          .then(function(followees) {

            if (typeof followees === 'undefined') {
              followees = [];
            }

            response.FollowedUsers = followees;

            return callback(null);

          }, function(err) {
            console.log(err);
            return ctrl.errorCallback(callback, 1, "Could not retrieve followed users.");
          });
      },

      // Returns the response..
      function(callback) {
        return callback(null, response);
      },

    ], ctrl.asyncCallback(deferred));
    return deferred.promise;

  };

  this.getBlockedUsers = function(request, response, app) {
    var data = request.data;
    var response = {};
    var deferred = q.defer();

    async.waterfall([
      // Check if already followed
      function(callback) {

        response.BlockedUsers = [];

        knex
          .select([
            'user_id as UserID',
            'other_user_id as OtherUserID',
          ])
          .from('blocked_users')
          .where('user_id', request.userID)
          .orWhere('other_user_id', request.userID)
          .then(function(users) {

            if (typeof users === 'undefined') {
              users = [];
            }

            response.BlockedUsers = users;

            return callback(null);

          }, function(err) {
            console.log(err);
            return ctrl.errorCallback(callback, 1, "Could not retrieve blocked users.");
          });
      },

      // Returns the response..
      function(callback) {
        return callback(null, response);
      },

    ], ctrl.asyncCallback(deferred));
    return deferred.promise;

  };


  this.followUser = function(request, response, app) {
    var data = request.data;
    var response = {};
    var currentUser = null;
    var deferred = q.defer();
    async.waterfall([
      // Data validation...
      function(callback) {
        var errors = validate(data, singleUserIdRequestConstraints);
        if (errors) {
          return ctrl.errorCallback(callback, 1, "Invalid Parameters", errors);
        }
        return callback(null);
      },

      // Check if already followed
      function(callback) {
        knex
          .select()
          .from('user_followers')
          .where('user_followers.user_id', data.UserID)
          .andWhere('user_followers.follower_id', request.userID)
          .first()
          .then(function(response) {

            if (typeof response === 'undefined') {
              return callback(null, false);
            }

            return callback(null, true);

          }, function(err) {
            return ctrl.errorCallback(callback, 1, "Could not retrieve follow status.");
          });
      },

      // Add follower...
      function(alreadyFollowed, callback) {

        if (alreadyFollowed || data.UserID == request.userID) {
          return callback(null);
        }

        knex('user_followers')
          .insert({
            user_id: data.UserID,
            follower_id: request.userID,
            created_at: moment().format("YYYY-MM-DD HH:mm:ss")
          })
          .then(function(teamIDs) {
            return callback(null);
          }, function(err) {
            return ctrl.errorCallback(callback, 1, "Error following player.");
          });

      },

      // Get user data for notif
      function(callback) {
        knex('reg_info').select(['name', 'last_name', 'picture', 'user_id'])
          .where('user_id', request.userID)
          .then(function(results) {
            if (results.length === 0) {
              return ctrl.errorCallback(callback, 1,
                "Cannot get user data");
            }
            callback(null, results[0].name, results[0].last_name, results[0].picture);
          })
          .catch(function(err) {
            console.log(err);
            return ctrl.errorCallback(callback, 1, "Unknown error");
          });
      },

      // Insert data to posts
      function(firstName, lastName, pictureURL, callback) {
        if (data.UserID == request.userID) {
          return callback(null);
        }

        var notification = {
          type: NotificationService.notificationTypes.NEW_FOLLOWER,
          timestamp: (new Date()).getTime(),
          data: JSON.stringify({
            'UserID': request.userID,
            'FirstName': firstName,
            'LastName': lastName,
            'PictureURL': pictureURL
          }),
        };

        var notifMessage = firstName + " " + lastName + " is now following you";
        return Promise.all([
          NewsfeedService.createSystemPost({
            'userID': request.userID, 
            'postTitle': "followed this player", 
            'postContent': '', 
            'postType': 'following', 
            'postParentID': data.UserID, 
            'postParentType': 'user', 
            'postMeta': null
          }),
          NotificationService.sendNotifications(
            [data.UserID],
            notification,
            notifMessage,
            app),
        ]).then(function() {
          return callback(null);
        }, function(err) {
          ctrl.errorCallback(callback, 1, "Error sending notification", err);
        });
      },

      // Returns the response..
      function(callback) {
        return callback(null, response);
      },

    ], ctrl.asyncCallback(deferred));
    return deferred.promise;

  }


  this.unfollowUser = function(request, response, app) {
    var data = request.data;
    var response = {};
    var currentUser = null;
    var deferred = q.defer();
    async.waterfall([
      // Data validation...
      function(callback) {
        var errors = validate(data, singleUserIdRequestConstraints);
        if (errors) {
          return ctrl.errorCallback(callback, 1, "Invalid Parameters", errors);
        }
        return callback(null);
      },

      // delete follower...
      function(callback) {

        knex('user_followers')
          .where('user_followers.user_id', data.UserID)
          .andWhere('user_followers.follower_id', request.userID)
          .whereRaw(' (created_at < DATE_SUB(NOW(), INTERVAL 1 HOUR) OR created_at IS NULL)')
          .delete()
          .then(function(teamIDs) {
            return callback(null);
          }, function(err) {
            console.log(err);
            return ctrl.errorCallback(callback, 1, "Error unfollowing user.");
          });

      },


      // Returns the response..
      function(callback) {
        return callback(null, response);
      },

    ], ctrl.asyncCallback(deferred));
    return deferred.promise;

  };

  this.getQuickbloxData = function(request, response, app) {
    var data = request.data;
    var response = {};
    var deferred = q.defer();

    async.waterfall([
      function(callback) {
        knex.select(
          [
            'user_id AS UserID',
            'password AS Password',
            'chat_user_id AS ChatUserID',
          ])
          .from('user_chat_sessions')
          .where('user_id', request.userID)
          .then(function(users){
            response.QuickbloxData = users[0];
            return callback(null);
          }, function(err) {
            console.log(err);
            return ctrl.errorCallback(callback, 1, "Error unfollowing user.");
          });

      },

      // Returns the response...
      function(callback) {
        return callback(null, response);
      },

    ], ctrl.asyncCallback(deferred));
    return deferred.promise;
  };

  this.hasUpdates = function(packet) {
    var data = packet.data;
    var response = {};
    var singleUserIdRequestConstraints = {
      UserID: {
        presence: {
          message: "is required"
        }
      },
      PostID: {
        presence: {
          message: "is required"
        },
        numericality: {
          onlyInteger: true
        }
      },
      NotificationID: {
        presence: {
          message: "is required"
        },
        numericality: {
          onlyInteger: true
        }
      }
    };

    var deferred = q.defer();
    async.waterfall([
      // Data validation...
      function(callback) {
        var errors = validate(data, singleUserIdRequestConstraints);
        if (errors) {
          return ctrl.errorCallback(callback, 1, "Invalid Parameters", errors);
        }
        return callback(null);
      },

      // Has Notifications
      function(callback) {
        knex('notifications')
          .select(['*'])
          .where('user_id', data.UserID)
          .where('id', '>', data.NotificationID)
          .then(function(results) {
            response.Notifications = results.length ? true : false;
            return callback(null);
          });
      },

      // Has Newsfeed
      function(callback) {
        knex('posts')
          .select(['*'])
          .leftJoin('user_followers', 'user_followers.user_id', 'posts.user_id')
          .leftJoin('reg_info', 'user_followers.user_id', 'reg_info.user_id')
          .leftJoin('user', 'user_followers.user_id', 'user.id')
          .where('user_followers.follower_id', data.UserID)
          .where('user_followers.user_id', '<>', data.UserID)
          .whereRaw('posts.id NOT IN (SELECT posts.id FROM posts WHERE (posts.post_type = \'following\' OR posts.post_type = \'rating\') AND posts.post_parent_type = \'user\' AND posts.post_parent_id = ?)', [data.UserID])
          .whereNull('posts.deleted_at')
          .where('posts.id', '>', data.PostID)
          .groupBy('posts.id')
          .then(function(results) {
            response.Posts = results.length ? true : false;
            return callback(null);
          });
      },

      // Returns the response..
      function(callback) {
        return callback(null, response);
      },

    ], ctrl.asyncCallback(deferred));
    return deferred.promise;
  };
}

module.exports = new UserController();
