"use strict";

var knex = require('lib/knex'),
  q = require('q'),
  fs = require('fs'),
  config = require('config'),
  suid = require('rand-token').suid,
  async = require('async'),
  moment = require('moment'),
  validate = require("validate.js"),
  log = require('helpers/logger'),
  urlFixer = require('helpers/url-fixer');

var articleService = require('services/article-service');

var firebase = require('helpers/firebase');
var NewsfeedService = require('services/newsfeed-service');
var NotificationService = require('services/notification-service');

var Controller = require('controllers/controller');

class PostController extends Controller {

  constructor() {
    super(null);

    this.singlePostIDRequestConstraints = {
      PostID: {
        presence: {
          message: "is required"
        },
        numericality: {
          onlyInteger: true,
          greaterThan: 0
        }
      },
    };

    this.singleCommentIDRequestConstraints = {
      CommentID: {
        presence: {
          message: "is required"
        },
        numericality: {
          onlyInteger: true,
          greaterThan: 0
        }
      },
    };
  }

  __commentTransformerGenerator(currentUserID, comment_likes) {
    return function(item) {
      var comment = {};
      comment.CommentID = item.comment_id;
      comment.PostID = item.comment_post_id;
      comment.ParentID = item.comment_parent_id;
      comment.Content = item.comment_content;
      comment.CreatedAt = item.comment_created_at;
      comment.Reply = [];

      comment.NumberOfLikes = comment_likes.filter(function(comment_like){
        return comment_like.comment_id == item.comment_id;
      }).length;

      comment.LikedByCurrentUser = comment_likes.filter(function(comment_like){
        return comment_like.user_id === currentUserID && comment_like.comment_id == item.comment_id;
      }).length > 0;

      var user = {
        'UserID': item.user_id,
        'CurrentUser': item.user_id === currentUserID,
        'UserPictureUrl': item.user_picture_url,
        'FirstName': item.user_first_name,
        'LastName': item.user_last_name,
        'UserFullName': item.user_first_name + item.user_last_name,
        'UserGender': 'male',
      }
      comment.User = user;
      return comment;
    };
  }

  __likedByTransformerGenerator(currentUserID, post_likes) {
    return function(item) {
      var likedBy = {};

      likedBy = {
        'UserID': item.user_id,
        'CurrentUser': item.user_id === currentUserID,
        'UserPictureUrl': item.picture,
        'UserFullName': item.name + ' ' + item.last_name,
        'Gender': item.gender,
        'CreatedAt': item.created_at
      };

      return likedBy;
    };
  }

  __postTransformerGenerator(currentUserID, comments, post_likes, comment_likes, post_meta){
    var self = this;
    return function(result) {
      var post = {};

      post.id = result.post_id;
      post.type = result.post_type;
      post.datetime = result.post_created_at;
      post.timestamp = result.post_created_at;
      post.Description = result.post_title;
      post.content = result.post_content;
      post.postParentType = result.post_parent_type;
      post.postParentId = result.post_parent_id;

      if (post.type === 'photo') {
        // Temporary fix for old builds of IOS and ANDROID.
        post.content = urlFixer(post.content);
      }

      post.numberOfLikes = post_likes.filter(function(item){
        return item.post_id === result.post_id;
      }).length;

      post.likedByCurrentUser = post_likes.filter(function(item){
        return item.user_id === currentUserID && item.post_id === result.post_id;
      }).length > 0;

      post.likedBy = post_likes.filter(function(item){
        return item.post_id === result.post_id;
      }).map(self.__likedByTransformerGenerator(currentUserID, post_likes));

      post.user = {
        'id': result.user_id,
        'currentUser': result.user_id === currentUserID,
        'PictureUrl': result.user_picture_url,
        'FirstName': result.user_first_name,
        'LastName': result.user_last_name,
        'gender': 'male',
      };

      post.comments = comments.filter(function(item) {
        return item.comment_post_id === result.post_id;
      }).map(self.__commentTransformerGenerator(currentUserID, comment_likes));

      post.additionalData = post_meta.filter(function(item) {
        return item.post_id === result.post_id;
      }).map(function(item) {
        return {
          key: item.meta_key,
          value: item.meta_value,
        };
      });

      return post;

    };
  }

  __getPosts(request) {
    var data = request.data;
    var response = {};
    var ctrl = this;
    var getNewsfeedRequestConstraints = {
      PostParentID: {
        presence: {
          message: "is required"
        },
        numericality: {
          onlyInteger: true
        }
      },

      PostParentType: {
        presence: {
          message: "is required"
        },
      },

    };

    var deferred = q.defer();
    async.waterfall([

      // Data validation...
      function(callback) {
        var errors = validate(data, getNewsfeedRequestConstraints);
        if (errors) {
          return ctrl.errorCallback(callback, 1, "Invalid Parameters", errors);
        }
        return callback(null);
      },

      // Check if gollowing
      function(callback) {
        if (data.PostParentType === 'user' && data.PostParentID !== request.userID) {
          knex.select()
            .from('user_followers')
            .where('follower_id', request.userID)
            .where('user_id', data.PostParentID)
            .then(function(results) {
              if (results.length === 0) {
                return ctrl.errorCallback(callback, 2, "You must follow this user to view the feed.");
              }

              return callback(null);
            }, function(err) {
              console.log(err);
              return ctrl.errorCallback(callback, 1, "User does not exist.", err);
            });
        } else if (data.PostParentType === 'team') {
          knex.select(['follower_id', 'team_id'])
            .from('team_followers')
            .where('follower_id', request.userID)
            .where('team_id', data.PostParentID)
            .union(function(){
              this.select(['id', 'manager_id'])
                .from('teams')
                .where('manager_id', request.userID)
                .where('id', data.PostParentID);
            })
            .union(function(){
              this.select(['team_id', 'user_id'])
                .from('team_players')
                .where('user_id', request.userID)
                .where('team_id', data.PostParentID);
            })
            .then(function(results) {
              if (results.length === 0) {
                return ctrl.errorCallback(callback, 3, "You must follow this team to view the feed.");
              }

              return callback(null);
            }, function(err) {
              console.log(err);
              return ctrl.errorCallback(callback, 1, "User does not exist.", err);
            });
        } else {
          return callback(null);
        }
      },

      // Get the user
      function(callback) {
        knex.select([
          'posts.id as post_id',
          'reg_info.user_id as user_id',
          'reg_info.name as user_first_name',
          'reg_info.last_name as user_last_name',
          'reg_info.picture as user_picture_url',
          'posts.post_type',
          'posts.created_at as post_created_at',
          'posts.post_title as post_title',
          'posts.post_content as post_content',
          'posts.post_parent_type as post_parent_type',
          'posts.post_parent_id as post_parent_id',
        ])
          .from('posts')
          .innerJoin('user', 'posts.user_id', 'user.id')
          .innerJoin('reg_info', 'reg_info.user_id', 'user.id')
          .where('posts.post_parent_type', data.PostParentType)
          .where('posts.post_parent_id', data.PostParentID)
          .whereRaw('posts.id NOT IN (SELECT posts.id FROM posts WHERE (posts.post_type = \'following\' OR posts.post_type = \'rating\')  AND posts.post_parent_type = \'user\' AND posts.post_parent_id = ? AND  posts.user_id = ?)', [data.PostParentID, data.PostParentID])
          .whereNull('posts.deleted_at')
          .where(function(){
            if(data.FirstPostID && data.FetchOnlyNewPosts) {
              this.whereRaw("posts.time >= (select posts.time from posts where posts.id = ?) AND posts.id <> ?", [data.FirstPostID, data.FirstPostID]);
            } else if(data.LastPostID) {
              this.whereRaw("posts.time <= (select posts.time from posts where posts.id = ?) AND posts.id <> ?", [data.LastPostID, data.LastPostID]);
            }

            if (data.PhotoOnly) {
              var postTypes = ['photo', 'cover picture update', 'profile picture update'];
              this.whereIn('posts.post_type', postTypes);
            }
          })
          .orderBy('posts.time', 'desc')
          .limit(10)
          .then(function(results) {
            if (typeof results === 'undefined') {
              results = [];
            }
            return callback(null, results);
          }, function(err) {
            console.log(err);
            return ctrl.errorCallback(callback, 1, "User does not exist.", err);
          });

      },

      function(results, callback) {

        var post_ids = results.map(function(result) {
          return result.post_id;
        });

        knex.select([
          'comments.id as comment_id',
          'comments.content as comment_content',
          'comments.post_id as comment_post_id',
          'comments.parent_id as comment_parent_id',
          'comments.created_at as comment_created_at',
          'reg_info.user_id as user_id',
          'reg_info.name as user_first_name',
          'reg_info.last_name as user_last_name',
          'reg_info.picture as user_picture_url',
        ])
          .from('comments')
          .innerJoin('user', 'comments.user_id', 'user.id')
          .innerJoin('reg_info', 'reg_info.user_id', 'user.id')
          .whereIn('comments.post_id', post_ids)
          .whereNull('comments.deleted_at')
          .then(function(comments) {
            if (typeof comments === 'undefined') {
              comments = [];
            }
            return callback(null, results, comments);
          }, function(err) {
            console.log(err);
            return ctrl.errorCallback(callback, 1, "User does not exist.", err);
          });

      },

      function(results, comments, callback) {

        var post_ids = results.map(function(result) {
          return result.post_id;
        });

        knex.select()
          .from('post_likes')
          .innerJoin('reg_info', 'post_likes.user_id', 'reg_info.user_id')
          .innerJoin('user', 'post_likes.user_id', 'user.id')
          .where('post_likes.like_type', 'like')
        //.where('post_likes.user_id', request.userID)
          .whereIn('post_likes.post_id', post_ids)
          .whereNull('post_likes.deleted_at')
          .then(function(post_likes) {
            if (typeof post_likes === 'undefined') {
              post_likes = [];
            }
            return callback(null, results, comments, post_likes);
          }, function(err) {
            console.log(err);
            return ctrl.errorCallback(callback, 1, "User does not exist.", err);
          });

      },

      function(results, comments, post_likes, callback) {

        var comment_ids = comments.map(function(result) {
          return result.comment_id;
        });

        knex.select()
          .from('comment_likes')
          .where('comment_likes.like_type', 'like')
          .where('comment_likes.user_id', request.userID)
          .whereIn('comment_likes.comment_id', comment_ids)
          .whereNull('comment_likes.deleted_at')
          .then(function(comment_likes) {
            if (typeof comment_likes === 'undefined') {
              comment_likes = [];
            }
            return callback(null, results, comments, post_likes, comment_likes);
          }, function(err) {
            console.log(err);
            return ctrl.errorCallback(callback, 1, "User does not exist.", err);
          });

      },

      function(results, comments, post_likes, comment_likes, callback) {

        var post_ids = results.map(function(result) {
          return result.post_id;
        });

        knex.select()
          .from('post_meta')
          .whereIn('post_meta.post_id', post_ids)
          .then(function(post_meta) {
            if (typeof post_meta === 'undefined') {
              post_meta = [];
            }
            return callback(null, results, comments, post_likes, comment_likes, post_meta);
          }, function(err) {
            console.log(err);
            return ctrl.errorCallback(callback, 1, "User does not exist.", err);
          });

      },

      function(results, comments, post_likes, comment_likes, post_meta, callback) {
        var posts = results.map(ctrl.__postTransformerGenerator(request.userID, comments, post_likes, comment_likes, post_meta));

        // console.log(util.inspect(posts, {depth: 4}));
        response.posts = posts;
        return callback(null);
      },

      // Returns the response..
      function(callback) {
        return callback(null, response);
      },

    ], ctrl.asyncCallback(deferred));
    return deferred.promise;
  }

  // I have no fucking idea why where are 2 getPosts methods, i'm too scared to
  // remove one and have everything break, sincere apologies to any future dev
  //
  // GLHF!!!
  getPosts(request) {
    var data = request.data;
    var ctrl = this;
    var deferred = q.defer();
    var response = {};

    var getNewsfeedRequestConstraints = {
      PostParentID: {
        presence: {
          message: "is required"
        },
        numericality: {
          onlyInteger: true
        }
      },

      PostParentType: {
        presence: {
          message: "is required"
        },
      },

    };

    async.waterfall([
      // Data validation...
      function(callback) {
        var errors = validate(data, getNewsfeedRequestConstraints);
        if (errors) {
          return ctrl.errorCallback(callback, 1, "Invalid Parameters", errors);
        }
        return callback(null);
      },

      // Check if gollowing
      function(callback) {
        if (data.PostParentType === 'user' && data.PostParentID !== request.userID) {
          NewsfeedService.checkIfCanViewPosts(request.userID, data).then(function(results) {
            if(results === true) {
              return callback(null);
            }

            if (results.length > 0) {
              return callback(null);
            }

            return ctrl.errorCallback(callback, 2, "You do not have enough permissions to view this feed.");

          }, function(err) {
            console.log(err);
            return ctrl.errorCallback(callback, 1, "Could not find requested entity", err);
          });
        }
        else {
          return callback(null);
        }
      },

      // Get newsfeed posts...
      function(callback) {
        NewsfeedService.getProfilePosts(request.userID, data).then(function(results) {
          var posts = (typeof results === 'undefined') ? [] : results;
          return callback(null, posts);
        }, function(err) {
          return ctrl.errorCallback(callback, 1, "Could not retrieve newsfeed.", err);
        });
      },

      // Transform the posts...
      function(posts, callback) {
        NewsfeedService.transformPostResults(request.userID, posts).then(function(transformedPosts) {
          response.Posts = transformedPosts;
          return callback(null, response);
        }, function(err) {
          return ctrl.errorCallback(callback, err[0], err[1], err[2]);
        });
      }

    ], ctrl.asyncCallback(deferred));
    return deferred.promise;
  }

  getNewsfeed(request) {
    var data = request.data;
    var ctrl = this;
    var deferred = q.defer();
    var response = {};

    var getNewsfeedRequestConstraints = {
      LastPostID: {
        numericality: {
          onlyInteger: true
        }
      },
    };

    async.waterfall([
      // Data validation...
      function(callback) {
        var errors = validate(data, getNewsfeedRequestConstraints);
        if (errors) {
          log.error(errors);
          return ctrl.errorCallback(callback, 1, "Invalid Parameters", errors);
        }
        return callback(null);
      },

      // Get newsfeed posts...
      function(callback) {
        NewsfeedService.getNewsfeedPosts(request.userID, data).then(function(results) {
          var posts = (typeof results === 'undefined') ? [] : results;
          return callback(null, posts);
        }, function(err) {
          log.error(err);
          return ctrl.errorCallback(callback, 1, "Could not retrieve newsfeed.", err);
        });
      },

      // Transform the posts...
      function(posts, callback) {
        NewsfeedService.transformPostResults(request.userID, posts).then(function(transformedPosts) {
          response.Newsfeed = transformedPosts;
          return callback(null);
        }, function(err) {
          log.error(err);
          return ctrl.errorCallback(callback, err);
        });
      },

      // Add articles...
      function(callback) {
        // Get all articles in the past 24 hours
        articleService.getRecentArticlesTimeCutoff((new Date()).getTime() + 24*3600000)
          .then(function(res) {
            articleService.populateArticleList(res)
              .then(function(res2) {
                for (var ii = 0; ii < res2.length; ++ii) {
                  response.Newsfeed.splice(
                    Math.floor(Math.random()*response.Newsfeed.length), 
                    0, {
                      PostType: "article",
                      CreatedAt: res2[ii].time_posted,
                      Timestamp: res2[ii].time_posted,
                      PostTitle: res2[ii].title,
                      PostContent: res2[ii].article_body,
                    });
                }
                return callback(null, response);
              })
              .catch(function(err) {
                log.error(err);
                return ctrl.errorCallback(callback, err);
              });
          })
          .catch(function(err) {
            log.error(err);
            return ctrl.errorCallback(callback, err);
          });
      },
    ], ctrl.asyncCallback(deferred));
    return deferred.promise;
  }

  create(request, response, app) {
    response = {};

    var data = request.data;
    var ctrl = this;
    var team = null;
    var user = null;
    var createPostRequestConstraints = {

      PostParentID: {
        presence: {
          message: "is required"
        },
        numericality: {
          onlyInteger: true,
          greaterThan: 0
        }
      },

      PostParentType: {
        presence: {
          message: "is required"
        },
      },

      PostType: {
        presence: {
          message: "is required"
        },
      },

    };

    var deferred = q.defer();
    async.waterfall([

      // Data validation...
      function(callback) {
        var errors = validate(data, createPostRequestConstraints);
        if (errors) {
          return ctrl.errorCallback(callback, 1, "Invalid Parameters", errors);
        }
        return callback(null);
      },

      // Post Image
      function(callback) {

        if (typeof data.PostImage === 'undefined') {
          return callback(null);
        }

        if (!data.PostImage) {
          return callback(null);
        }

        var img = data.PostImage;
        var sanitizedImageData = img.replace(/^data:image\/\w+;base64,/, "");
        var buf = new Buffer(sanitizedImageData, 'base64');
        var filename = suid(32) + '.jpg';

        fs.writeFile('public/UserUploads/' + filename, buf, function(err) {
          if (err) {
            return callback(err);
          }
          data.PostContent = config.baseUrl + 'UserUploads/' + filename;
          callback(null);
        });

      },

      function(callback) {

        var postdata = {};
        var now = moment();
        postdata.post_title = data.PostTitle ? data.PostTitle : '';
        postdata.post_status = 'publish';
        postdata.comment_status = 'open';
        postdata.user_id = request.userID;
        postdata.post_content = data.PostContent;
        postdata.post_parent_id = data.PostParentID;
        postdata.post_parent_type = data.PostParentType;
        postdata.post_type = data.PostType;
        postdata.created_at = now.format("YYYY-MM-DD HH:mm:ss");
        postdata.updated_at = now.format("YYYY-MM-DD HH:mm:ss");
        postdata.time = now.valueOf();

        knex('posts')
          .insert(postdata)
          .then(function(ids){
            if(!ids.length) {
              return ctrl.errorCallback(callback, 1, "Could not create post");
            }
            postdata.id = ids[0];
            callback(null, postdata)
          }, function(error) {
            return ctrl.errorCallback(callback, 1, "Error occured while creating post.", error);
          });
      },

      // Get user (team owner) details for notification
      function(postdata, callback) {
        if (data.PostParentType != 'team') {
          return callback(null, postdata);
        }

        knex('teams')
          .select([
            'id as team_id',
            'name as team_name',
            'manager_id as manager_id',
          ])
          .where('id', data.PostParentID)
          .then(function(teams){
            if(!teams.length) {
              return ctrl.errorCallback(callback, 2, "Team no longer exists");
            }

            team = teams[0];
            return callback(null, postdata);
          }, function(error) {
            return ctrl.errorCallback(callback, 1, "Error occured while creating post.", error);
          });
      },

      // Get notif sender details
      function(postdata, callback) {

        knex('reg_info')
          .select([
            'user_id as user_id',
            'name as first_name',
            'last_name as last_name',
            'picture as picture_url'
          ])
          .where('user_id', request.userID)
          .then(function(players){
            if(!players.length) {
              return ctrl.errorCallback(callback, 3, "Player no longer exists");
            }

            user = players[0];
            return callback(null, postdata);
          }, function(error) {
            return ctrl.errorCallback(callback, 1, "Error occured while retreiving user details.", error);
          });
      },

      // Returns the response..
      function(postdata, callback) {

        knex.select([
          'posts.id as post_id',
          'reg_info.user_id as user_id',
          'reg_info.name as user_first_name',
          'reg_info.last_name as user_last_name',
          'reg_info.picture as user_picture_url',
          'posts.post_type',
          'posts.created_at as post_created_at',
          'posts.post_title as post_title',
          'posts.post_content as post_content',
        ])
          .from('posts')
          .innerJoin('user', 'posts.user_id', 'user.id')
          .innerJoin('reg_info', 'reg_info.user_id', 'user.id')
          .where('posts.id', postdata.id)
          .first()
          .then(function(result) {
            response.Post = ctrl.__postTransformerGenerator(request.userID, [], [], [], [])(result);
            callback(null, postdata);
          }, function(err) {
            console.log(err);
            return ctrl.errorCallback(callback, 1, "Error retreiving created post.", err);
          });

      },

      // Send notifications...
      function(postdata, callback) {
        if (data.PostParentID == request.userID) {
          return callback(null);
        }

        var postParentType = data.PostParentType;
        if (postParentType == 'team' && request.userID == team.manager_id) {
          return callback(null);
        }

        var notificationType = NotificationService.notificationTypes.POST_ON_USER_WALL;
        if (postParentType == 'team') {
          notificationType = NotificationService.notificationTypes.POST_ON_TEAM_WALL;
        }

        var notificationData = {};
        notificationData.PostID = postdata.id;
        notificationData.UserID = user.user_id;
        notificationData.FirstName = user.first_name;
        notificationData.LastName = user.last_name;
        notificationData.PictureURL = user.picture_url;
        notificationData.PostType = data.PostType;

        var userIDToNotify = data.PostParentID;
        if (postParentType == 'team') {
          notificationData.TeamID = data.PostParentID;
          notificationData.TeamName = team.team_name;
          userIDToNotify = team.manager_id;
        }

        var notification = {};
        notification.timestamp = (new Date()).getTime();
        notification.type = notificationType;
        notification.data =  JSON.stringify(notificationData);

        var name = user.first_name + " " + user.last_name;

        var title = (postParentType == 'user') ? name + " has posted on your wall" : name + " has posted on your team wall";
        var body = (postParentType == 'user') ? name + " has posted on your wall" : name + " has posted on your team wall";

        var notificationTask = NotificationService.sendNotifications(
          [userIDToNotify], 
          notification,
          body,
          app
        );

        Promise.all([
          notificationTask,
        ]).then(function(values) {
          // console.log('Notification completed');
        }).catch(function(err) {
          console.log('Notification tasks errored:');
          console.error(err);
        });

        // We dont need to wait for the notifications to be sent to return a response...
        return callback(null);
      },

      function(callback) {
        return callback(null, response);
      }

    ], ctrl.asyncCallback(deferred));
    return deferred.promise;
  }

  deletePost(request, response, app) {

    var data = request.data;
    var response = {};
    var ctrl = this;
    var deletePostRequestConstraints = {
      PostID: {
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
        var errors = validate(data, deletePostRequestConstraints);
        if (errors) {
          return ctrl.errorCallback(callback, 1, "Invalid Parameters", errors);
        }
        return callback(null);
      },

      // Check the owner of the post
      function(callback) {

        knex('posts')
          .select()
          .where('id', data.PostID)
          .then(function(posts){
            if (posts.length === 0) {
              return ctrl.errorCallback(callback, 2, "Post no longer exists");
            }

            callback(null, posts);
          }, function(error) {
            return ctrl.errorCallback(callback, 1, "Error occured while creating post.", error);
          });
      },

      // Check if user can delete post
      function(posts, callback) {
        var post = posts[0];
        if (post.post_parent_type === 'user' && posts[0].user_id !== request.userID && posts[0].post_parent_id !== request.userID) {
          return ctrl.errorCallback(callback, 3, "You do not have the right to delete this post");
        } else if (data.PostParentType === 'team') {
          knex.select(['manager_id'])
            .from('teams')
            .where('id', post.post_parent_id)
            .then(function(teams) {
              if (teams.length === 0) {
                return ctrl.errorCallback(callback, 4, "Team no longer exists.");
              }

              if (posts[0].user_id !== request.userID && teams[0].manager_id !== request.userID) {
                return ctrl.errorCallback(callback, 3, "You do not have the right to delete this post");
              }

              return callback(null);
            }, function(err) {
              console.log(err);
              return ctrl.errorCallback(callback, 1, "User does not exist.", err);
            });
        } else {
          return callback(null, posts);
        }
      },

      // Update posts to delete
      function(postdata, callback) {

        knex('posts')
          .where('id', data.PostID)
          .update('deleted_at', moment().format("YYYY-MM-DD HH:mm:ss"))
          .then(function(results) {
            return callback(null, postdata);
          }, function(err) {
            log.error(err);
            return ctrl.errorCallback(callback, 1, "Database error while deleting posts");
          });
      },

      // Update post likes to delete
      function(postdata, callback) {

        knex('post_likes')
          .where('post_id', data.PostID)
          .update('deleted_at', moment().format("YYYY-MM-DD HH:mm:ss"))
          .then(function(results) {
            return callback(null, postdata);
          }, function(err) {
            log.error(err);
            return ctrl.errorCallback(callback, 1, "Database error while deleting post likes");
          });
      },

      // Get post comments to be deleted
      function(postdata, callback) {

        knex('comments')
          .select()
          .where('post_id', data.PostID)
          .then(function(comments) {
            if (comments.length !== 0) {
              comments = [];
            }

            return callback(null, postdata, comments);
          }, function(err) {
            log.error(err);
            return ctrl.errorCallback(callback, 1, "Database error while retreiving comments");
          });
      },

      // Update post comments to deleted
      function(postdata, comments, callback) {

        knex('comments')
          .where('post_id', data.PostID)
          .update('deleted_at', moment().format("YYYY-MM-DD HH:mm:ss"))
          .then(function(results) {
            return callback(null, postdata, comments);
          }, function(err) {
            log.error(err);
            return ctrl.errorCallback(callback, 1, "Database error while deleting comments");
          });
      },

      // Update post comment likes to deleted
      function(postdata, comments, callback) {

        var commentIDs = comments.map(function(comment){
          return comment.id;
        });

        knex('comment_likes')
          .whereIn('comment_id', commentIDs)
          .update('deleted_at', moment().format("YYYY-MM-DD HH:mm:ss"))
          .then(function(results) {
            return callback(null);
          }, function(err) {
            log.error(err);
            return ctrl.errorCallback(callback, 1, "Database error while deleting comment likes");
          });
      },

      // Return response
      function(callback) {
        return callback(null, response);
      }

    ], ctrl.asyncCallback(deferred));
    return deferred.promise;
  }

  likePost(request, response, app) {

    var data = request.data;
    var response = {};
    var ctrl = this;
    var post = null;
    var user = null;
    var team = null;
    var userIDsToNotify = [];

    var deferred = q.defer();
    async.waterfall([

      // Data validation...
      function(callback) {
        var errors = validate(data, ctrl.singlePostIDRequestConstraints);
        if (errors) {
          return ctrl.errorCallback(callback, 1, "Invalid Parameters", errors);
        }
        return callback(null);
      },

      function(callback) {
        knex.select()
          .from('post_likes')
          .where('post_likes.post_id', data.PostID)
          .where('post_likes.user_id', request.userID)
          .first()
          .then(function(result){
            if(typeof result !== 'undefined') {
              return callback(null, result);
            }

            callback(null, false);

          }, function(error) {
            return ctrl.errorCallback(callback, 1, "Error occured while creating post.", error);
          });
      },

      function(likedata, callback) {

        if (likedata) {
          return callback(null, likedata)
        }

        likedata = {}
        likedata.user_id = request.userID;
        likedata.post_id = data.PostID;
        likedata.like_type = 'like';
        likedata.created_at = moment().format("YYYY-MM-DD HH:mm:ss");
        likedata.updated_at = moment().format("YYYY-MM-DD HH:mm:ss");

        knex('post_likes')
          .insert(likedata)
          .then(function(ids){
            if(!ids.length) {
              return ctrl.errorCallback(callback, 1, "Could not create post");
            }
            likedata.id = ids[0];
            callback(null, likedata)
          }, function(error) {
            return ctrl.errorCallback(callback, 1, "Error occured while creating post.", error);
          });
      },

      // Get post details
      function(likedata, callback) {

        if (!likedata) {
          return callback(null, false);
        }

        knex('posts')
          .select()
          .where('id', data.PostID)
          .then(function(posts){
            if (!posts.length) {
              return ctrl.errorCallback(callback, 2, "Post no longer exists");
            }

            post = posts[0];

            var postUserId = post.user_id;
            if (post.post_parent_type == 'user' && request.userID != postUserId) {
              userIDsToNotify.push(postUserId);
            }

            return callback(null, likedata);
          }, function(error) {
            return ctrl.errorCallback(callback, 1, "Error occured while creating post.", error);
          });
      },

      // Get user (team owner) details for notification
      function(likedata, callback) {
        if (post.post_parent_type != 'team') {

          if (request.userID != post.post_parent_id && 
            post.user_id != post.post_parent_id) {
            userIDsToNotify.push(post.post_parent_id);
          }

          return callback(null, likedata);
        }

        knex('teams')
          .select([
            'id as team_id',
            'name as team_name',
            'manager_id as manager_id',
          ])
          .where('id', post.post_parent_id)
          .then(function(teams){
            if(!teams.length) {
              return ctrl.errorCallback(callback, 3, "Team no longer exists");
            }

            team = teams[0];
            var managerID = team.manager_id;
            if (managerID != request.userID && managerID != post.user_id) {
              userIDsToNotify.push(managerID);
            }

            if (post.user_id != request.userID && post.user_id != managerID) {
              userIDsToNotify.push(post.user_id);
            }

            return callback(null, likedata);
          }, function(error) {
            return ctrl.errorCallback(callback, 1, "Error occured while creating post.", error);
          });
      },

      // Get notif sender details
      function(likedata, callback) {

        knex('reg_info')
          .select([
            'user_id as user_id',
            'name as first_name',
            'last_name as last_name',
            'picture as picture_url'
          ])
          .where('user_id', request.userID)
          .then(function(players){
            if(!players.length) {
              return ctrl.errorCallback(callback, 3, "Player no longer exists");
            }

            user = players[0];
            return callback(null, likedata);
          }, function(error) {
            return ctrl.errorCallback(callback, 1, "Error occured while retreiving user details.", error);
          });
      },

      // Send notifications...
      function(likedata, callback) {
        var postParentType = post.post_parent_type;
        var notificationType = NotificationService.notificationTypes.LIKE_POST;

        var notificationData = {};
        notificationData.PostID = post.id;
        notificationData.UserID = user.user_id;
        notificationData.FirstName = user.first_name;
        notificationData.LastName = user.last_name;
        notificationData.PictureURL = user.picture_url;
        notificationData.PostType = post.post_type;

        if (postParentType == 'team') {
          notificationData.TeamID = post.post_parent_id;
          notificationData.TeamName = team.team_name;
        }

        var notification = {};
        notification.timestamp = (new Date()).getTime();
        notification.type = notificationType;
        notification.data =  JSON.stringify(notificationData);

        var title = user.first_name + " " + user.last_name + " has commented on a post.";
        var body = user.first_name + " " + user.last_name + " has commented on a post.";

        var notificationTask = NotificationService.sendNotifications(
          userIDsToNotify, 
          notification,
          body,
          app
        );

        Promise.all([
          notificationTask,
        ]).then(function(values) {
          // console.log('Notification completed');
        }).catch(function(err) {
          console.log('Notification tasks errored 1:');
          console.error(err);
        });

        // We dont need to wait for the notifications to be sent to return a response...
        return callback(null, likedata);
      },

      function(likedata, callback) {
        return callback(null, response);
      }

    ], ctrl.asyncCallback(deferred));
    return deferred.promise;
  }

  unlikePost(request, response, app) {

    var data = request.data;
    var response = {};
    var ctrl = this;

    var deferred = q.defer();
    async.waterfall([

      // Data validation...
      function(callback) {
        var errors = validate(data, ctrl.singlePostIDRequestConstraints);
        if (errors) {
          return ctrl.errorCallback(callback, 1, "Invalid Parameters", errors);
        }
        return callback(null);
      },

      function(callback) {
        knex.select()
          .from('post_likes')
          .where('post_likes.post_id', data.PostID)
          .where('post_likes.user_id', request.userID)
          .delete()
          .then(function(result){
            callback(null);
          }, function(error) {
            return ctrl.errorCallback(callback, 1, "Error occured while creating post.", error);
          });
      },

      function(callback) {
        return callback(null, response);
      }

    ], ctrl.asyncCallback(deferred));
    return deferred.promise;
  }

  postComment(request, response, app) {

    var data = request.data;
    var response = {};
    var ctrl = this;
    var post = null;
    var team = null;
    var user = null;
    var userIDsToNotify = null;

    var postCommentRequestConstraints = {

      PostID: {
        presence: {
          message: "is required"
        },
        numericality: {
          onlyInteger: true,
          greaterThan: 0
        }
      },

      ParentID: {
        presence: {
          message: "is required"
        },
      },

      Content: {
        presence: {
          message: "is required"
        },
      },

    };

    var deferred = q.defer();
    async.waterfall([

      // Data validation...
      function(callback) {
        var errors = validate(data, ctrl.postCommentRequestConstraints);
        if (errors) {
          return ctrl.errorCallback(callback, 1, "Invalid Parameters", errors);
        }
        return callback(null);
      },

      function(callback) {

        var comment = {}
        comment.user_id = request.userID;
        comment.post_id = data.PostID;
        comment.parent_id = data.ParentID;
        comment.content = data.Content;
        comment.created_at = moment().format("YYYY-MM-DD HH:mm:ss");
        comment.updated_at = moment().format("YYYY-MM-DD HH:mm:ss");

        knex('comments')
          .insert(comment)
          .then(function(ids){
            if(!ids.length) {
              return ctrl.errorCallback(callback, 1, "Could not create post");
            }
            comment.id = ids[0];
            callback(null, comment)
          }, function(error) {
            return ctrl.errorCallback(callback, 1, "Error occured while creating post.", error);
          });
      },

      // Get post details
      function(comment, callback) {
        knex('posts')
          .select()
          .where('id', data.PostID)
          .then(function(posts){
            if(!posts.length) {
              return ctrl.errorCallback(callback, 2, "Post no longer exists");
            }

            post = posts[0];            
            return callback(null, comment);
          }, function(error) {
            return ctrl.errorCallback(callback, 1, "Error occured while creating post.", error);
          });
      },

      // Get user (team owner) details for notification
      function(comment, callback) {
        if (post.post_parent_type != 'team') {
          return callback(null, comment);
        }

        knex('teams')
          .select([
            'id as team_id',
            'name as team_name',
            'manager_id as manager_id',
          ])
          .where('id', post.post_parent_id)
          .then(function(teams){
            if(!teams.length) {
              return ctrl.errorCallback(callback, 3, "Team no longer exists");
            }

            team = teams[0];
            return callback(null, comment);
          }, function(error) {
            return ctrl.errorCallback(callback, 1, "Error occured while creating post.", error);
          });
      },

      // Get notif sender details
      function(comment, callback) {

        knex('reg_info')
          .select([
            'user_id as user_id',
            'name as first_name',
            'last_name as last_name',
            'picture as picture_url'
          ])
          .where('user_id', request.userID)
          .then(function(players){
            if(!players.length) {
              return ctrl.errorCallback(callback, 3, "Player no longer exists");
            }

            user = players[0];
            return callback(null, comment);
          }, function(error) {
            return ctrl.errorCallback(callback, 1, "Error occured while retreiving user details.", error);
          });
      },

      // Get comment
      function(comment, callback) {

        knex.select([
          'comments.id as comment_id',
          'comments.content as comment_content',
          'comments.post_id as comment_post_id',
          'comments.parent_id as comment_parent_id',
          'comments.created_at as comment_created_at',
          'reg_info.user_id as user_id',
          'reg_info.name as user_first_name',
          'reg_info.last_name as user_last_name',
          'reg_info.picture as user_picture_url',
        ])
          .from('comments')
          .innerJoin('user', 'comments.user_id', 'user.id')
          .innerJoin('reg_info', 'reg_info.user_id', 'user.id')
          .where('comments.id', comment.id)
          .first()
          .then(function(result) {
            if (typeof result === 'undefined') {
              return ctrl.errorCallback(callback, 1, "Comment could not be added", err);
            }
            response.Comment = ctrl.__commentTransformerGenerator(request.userID, [])(result);
            return callback(null, comment);
          }, function(err) {
            console.log(err);
            return ctrl.errorCallback(callback, 1, "User does not exist.", err);
          });

      },

      // Get User IDs to send notifications
      function (comment, callback) {
        NewsfeedService.getUserIDs(comment.parent_id, data.PostID, request.userID)
          .then(function(userIDs) {
            userIDsToNotify = userIDs[0].map(function(item) {
              return item.user_id;
            });

            return callback(null, comment);
          }, function(err) {
            console.log(err);
            return ctrl.errorCallback(callback, 1, "Error while retreiving user IDs to notify", err);
          });
      },

      // Send notifications...
      function(comment, callback) {
        if (typeof userIDsToNotify === 'undefined' || !userIDsToNotify.length) {
          return callback(null);
        }

        var postParentType = post.post_parent_type;
        var notificationType = NotificationService.notificationTypes.COMMENT_ON_POST;
        var notificationData = {};
        notificationData.CommentID = comment.id;
        notificationData.UserID = user.user_id;
        notificationData.FirstName = user.first_name;
        notificationData.LastName = user.last_name;
        notificationData.PictureURL = user.picture_url;
        notificationData.PostID = data.PostID;
        notificationData.PostType = post.post_type;
        notificationData.CommentParentID = comment.parent_id;

        if (postParentType == 'team') {
          notificationData.TeamID = post.post_parent_id;
          notificationData.TeamName = team.team_name;
        }

        var notification = {};
        notification.timestamp = (new Date()).getTime();
        notification.type = notificationType;
        notification.data =  JSON.stringify(notificationData);

        var title = user.first_name + " " + user.last_name + " has commented on your post.";
        var body = user.first_name + " " + user.last_name + " has commented on your post.";

        var notificationTask = NotificationService.sendNotifications(
          userIDsToNotify, 
          notification,
          body,
          app
        );

        Promise.all([
          notificationTask
        ]).then(function(values) {
          // console.log('Notification completed');
        }).catch(function(err) {
          console.log('Notification tasks errored 2:');
          console.error(err);
        });

        // We dont need to wait for the notifications to be sent to return a response...
        return callback(null);
      },

      function(callback) {
        return callback(null, response);
      }

    ], ctrl.asyncCallback(deferred));
    return deferred.promise;
  }


  likeComment(request, response, app) {

    var data = request.data;
    var response = {};
    var ctrl = this;
    var post = null;
    var user = null;
    var team = null;
    var userIDsToNotify = [];

    var deferred = q.defer();
    async.waterfall([

      // Data validation...
      function(callback) {
        var errors = validate(data, ctrl.singleCommentIDRequestConstraints);
        if (errors) {
          return ctrl.errorCallback(callback, 1, "Invalid Parameters", errors);
        }
        return callback(null);
      },

      function(callback) {
        knex.select()
          .from('comment_likes')
          .where('comment_likes.comment_id', data.CommentID)
          .where('comment_likes.user_id', request.userID)
          .first()
          .then(function(result){
            if(typeof result !== 'undefined') {
              return callback(null, result);
            }

            callback(null, false);

          }, function(error) {
            return ctrl.errorCallback(callback, 1, "Error occured while creating post.", error);
          });
      },

      function(likedata, callback) {

        if (likedata) {
          return callback(null, likedata)
        }

        likedata = {}
        likedata.user_id = request.userID;
        likedata.comment_id = data.CommentID;
        likedata.like_type = 'like';
        likedata.created_at = moment().format("YYYY-MM-DD HH:mm:ss");
        likedata.updated_at = moment().format("YYYY-MM-DD HH:mm:ss");

        knex('comment_likes')
          .insert(likedata)
          .then(function(ids){
            if(!ids.length) {
              return ctrl.errorCallback(callback, 1, "Could not create post");
            }
            likedata.id = ids[0];
            callback(null, likedata)
          }, function(error) {
            return ctrl.errorCallback(callback, 1, "Error occured while creating post.", error);
          });
      },

      // Get post details
      function(likedata, callback) {

        if (!likedata) {
          return callback(null, false);
        }

        knex('comments')
          .select([
            'comments.id as comment_id',
            'comments.user_id as comment_user_id',
            'comments.parent_id as comment_parent_id',
            'posts.id as post_id',
            'posts.user_id as user_id',
            'posts.post_parent_id as post_parent_id',
            'posts.post_parent_type as post_parent_type',
            'posts.post_parent_type as post_type',
          ])
          .innerJoin('posts', 'posts.id', 'comments.post_id')
          .where('comments.id', data.CommentID)
          .then(function(posts){
            if (!posts.length) {
              return ctrl.errorCallback(callback, 2, "Post no longer exists");
            }

            post = posts[0];

            var postUserId = post.user_id;
            if (post.post_parent_type == 'user' && request.userID != postUserId) {
              userIDsToNotify.push(postUserId);
            }

            return callback(null, likedata);
          }, function(error) {
            return ctrl.errorCallback(callback, 1, "Error occured while creating post.", error);
          });
      },

      // Get user (team owner) details for notification
      function(likedata, callback) {
        if (post.post_parent_type != 'team') {

          if (request.userID != post.post_parent_id && 
            post.user_id != post.post_parent_id) {
            userIDsToNotify.push(post.post_parent_id);
          }

          return callback(null, likedata);
        }

        knex('teams')
          .select([
            'id as team_id',
            'name as team_name',
            'manager_id as manager_id',
          ])
          .where('id', post.post_parent_id)
          .then(function(teams){
            if(!teams.length) {
              return ctrl.errorCallback(callback, 3, "Team no longer exists");
            }

            team = teams[0];
            var managerID = team.manager_id;
            if (managerID != request.userID && managerID != post.user_id) {
              userIDsToNotify.push(managerID);
            }

            if (post.user_id != request.userID && post.user_id != managerID) {
              userIDsToNotify.push(post.user_id);
            }

            return callback(null, likedata);
          }, function(error) {
            return ctrl.errorCallback(callback, 1, "Error occured while creating post.", error);
          });
      },

      // Get notif sender details
      function(likedata, callback) {

        knex('reg_info')
          .select([
            'user_id as user_id',
            'name as first_name',
            'last_name as last_name',
            'picture as picture_url'
          ])
          .where('user_id', request.userID)
          .then(function(players){
            if(!players.length) {
              return ctrl.errorCallback(callback, 3, "Player no longer exists");
            }

            user = players[0];
            return callback(null, likedata);
          }, function(error) {
            return ctrl.errorCallback(callback, 1, "Error occured while retreiving user details.", error);
          });
      },

      // Send notifications...
      function(likedata, callback) {
        var userIDsToNotify = [];
        if (post.comment_user_id == request.userID) {
          return callback(null, likedata);
        }

        var postParentType = post.post_parent_type;

        var notificationType = NotificationService.notificationTypes.LIKE_COMMENT;

        var notificationData = {};
        notificationData.CommentID = post.comment_id;
        notificationData.UserID = user.user_id;
        notificationData.FirstName = user.first_name;
        notificationData.LastName = user.last_name;
        notificationData.PictureURL = user.picture_url;

        userIDsToNotify.push(post.comment_user_id); // TODO check fb
        if (postParentType == 'team') {
          notificationData.TeamID = post.post_parent_id;
          notificationData.TeamName = team.team_name;
        }

        var notification = {};
        notification.timestamp = (new Date()).getTime();
        notification.type = notificationType;
        notification.data =  JSON.stringify(notificationData);

        var title = "Like a comment";
        var body = "A player likes a comment";

        var notificationTask = NotificationService.sendNotifications(
          userIDsToNotify, 
          notification,
          body,
          app
        );

        Promise.all([
          notificationTask,
        ]).then(function(values) {
          // console.log('Notification completed');
        }).catch(function(err) {
          console.log('Notification tasks errored 3:');
          console.error(err);
        });

        // We dont need to wait for the notifications to be sent to return a response...
        return callback(null, likedata);
      },

      function(likedata, callback) {
        return callback(null, response);
      }

    ], ctrl.asyncCallback(deferred));
    return deferred.promise;
  }

  unlikeComment(request, response, app) {

    var data = request.data;
    var response = {};
    var ctrl = this;

    var deferred = q.defer();
    async.waterfall([

      // Data validation...
      function(callback) {
        var errors = validate(data, ctrl.singleCommentIDRequestConstraints);
        if (errors) {
          return ctrl.errorCallback(callback, 1, "Invalid Parameters", errors);
        }
        return callback(null);
      },

      function(callback) {
        knex.select()
          .from('comment_likes')
          .where('comment_likes.comment_id', data.CommentID)
          .where('comment_likes.user_id', request.userID)
          .delete()
          .then(function(result){
            callback(null);
          }, function(error) {
            return ctrl.errorCallback(callback, 1, "Error occured while creating post.", error);
          });
      },

      function(callback) {
        return callback(null, response);
      }

    ], ctrl.asyncCallback(deferred));
    return deferred.promise;
  }

  getPhotos(request, response, app) {
    var data = request.data;
    var response = {};
    var ctrl = this;
    var getPhotosRequestConstraints = {
      PostParentID: {
        presence: {
          message: "is required"
        },
        numericality: {
          onlyInteger: true,
          greaterThan: 0
        }
      },

      PostParentType: {
        presence: {
          message: "is required"
        },
      },

    };

    var deferred = q.defer();
    async.waterfall([

      // Data validation...
      function(callback) {
        var errors = validate(data, getPhotosRequestConstraints);
        if (errors) {
          return ctrl.errorCallback(callback, 1, "Invalid Parameters", errors);
        }
        return callback(null);
      },

      // Check blocked user
      function(callback) {

        if (data.PostParentType === 'team') {
          return callback(null);
        }

        knex('blocked_users')
          .select(['user_id', 'other_user_id'])
          .whereRaw('(user_id = ? AND other_user_id = ?) OR (user_id = ? AND other_user_id = ?)', [request.userID, data.PostParentID, data.PostParentID, request.userID])
          .then(function(results) {
            if (results.length > 0) {
              return ctrl.errorCallback(callback, 2, "Blocked user.");
            }

            return callback(null);
          })
          .catch(function(err) {
            console.log(err);
            return ctrl.errorCallback(callback, 1,
              "Unknown error", err);
          });
      },

      // Check if team exists
      function(callback) {

        if (data.PostParentType !== 'team') {
          return callback(null);
        }

        knex('teams')
          .where('id', data.PostParentID)
          .whereNotNull('deleted_at').debug()
          .then(function(results) {
            if (results.length > 0) {
              return ctrl.errorCallback(callback, 4, "Team no longer exists");
            }

            return callback(null);
          })
          .catch(function(err) {
            console.log(err);
            return ctrl.errorCallback(callback, 1,
              "Error while checking if team exists", err);
          });
      },

      // Check if following
      function(callback) {

        if (data.PostParentType === 'user' && data.PostParentID !== request.userID) {
          knex.select()
            .from('user_followers')
            .where('follower_id', request.userID)
            .where('user_id', data.PostParentID)
            .then(function(results) {
              if (results.length === 0) {
                return ctrl.errorCallback(callback, 2, "You must follow this user to view photos.");
              }

              return callback(null);
            }, function(err) {
              console.log(err);
              return ctrl.errorCallback(callback, 1, "User does not exist.", err);
            });
        } else if (data.PostParentType === 'team') {
          knex.select(['follower_id', 'team_id'])
            .from('team_followers')
            .where('follower_id', request.userID)
            .where('team_id', data.PostParentID)
            .union(function(){
              this.select(['id', 'manager_id'])
                .from('teams')
                .where('manager_id', request.userID)
                .where('id', data.PostParentID);
            })
            .union(function(){
              this.select(['team_id', 'user_id'])
                .from('team_players')
                .where('user_id', request.userID)
                .where('team_id', data.PostParentID);
            })
            .then(function(results) {
              if (results.length === 0) {
                return ctrl.errorCallback(callback, 3, "You must follow this team to view photos.");
              }

              return callback(null);
            }, function(err) {
              console.log(err);
              return ctrl.errorCallback(callback, 1, "User does not exist.", err);
            });
        } else {
          return callback(null);
        }
      },

      // Get photos
      function(callback) {

        response.Photos = [];

        knex.select([
          'id AS ID',
          'post_content AS Photo',
          'post_parent_id AS PostParentID',
          'post_parent_type AS PostParentType',
          'post_type AS PostType',
        ])
          .from('posts')
          .where('post_parent_type', data.PostParentType)
          .where('post_parent_id', data.PostParentID)
          .whereNull('deleted_at')
          .whereRaw(' (post_type = \'photo\' OR post_type LIKE \'%picture%\') ')
          .then(function(photos) {

            if (typeof photos === 'undefined') {
              photos = [];
            }

            response.Photos = photos;

            return callback(null);
          }, function(err) {
            console.log(err);
            return ctrl.errorCallback(callback, 1, "Could not retrieve photos", err);
          });

      },

      // Returns the response..
      function(callback) {
        return callback(null, response);
      },

    ], ctrl.asyncCallback(deferred));
    return deferred.promise;
  }

  updatePost(request, response, app) {

    var data = request.data;
    var response = {};
    var ctrl = this;
    var createPostRequestConstraints = {

      PostID: {
        presence: {
          message: "is required"
        },
        numericality: {
          onlyInteger: true
        }
      },

      PostContent: {
        presence: {
          message: "is required"
        },
      }

    };

    var deferred = q.defer();
    async.waterfall([

      // Data validation...
      function(callback) {
        var errors = validate(data, createPostRequestConstraints);
        if (errors) {
          return ctrl.errorCallback(callback, 1, "Invalid Parameters", errors);
        }
        return callback(null);
      },

      // Check post
      function(callback) {
        knex.select()
          .from('posts')
          .where('id', data.PostID)
          .then(function(posts) {
            if (posts.length === 0) {
              return ctrl.errorCallback(callback, 2, "Post no longer exists.");
            }

            if (posts[0].user_id !== request.userID) {
              return ctrl.errorCallback(callback, 3, "You do no have right to edit this post.");
            }

            return callback(null);
          }, function(err) {
            console.log(err);
            return ctrl.errorCallback(callback, 4, "Error retreiving created post.", err);
          });
      },

      function(callback) {

        var updatePost = {};

        if (data.PostTitle) {
          updatePost.post_title = data.PostTitle;
        }

        if (data.PostContent) {
          updatePost.post_content = data.PostContent;
        }

        updatePost.updated_at = moment().format("YYYY-MM-DD HH:mm:ss");

        knex('posts')
          .where('id', data.PostID)
          .update(updatePost)
          .then(function(results) {
            callback(null);
          }, function(error) {
            return ctrl.errorCallback(callback, 5, "Error occured while updating post.", error);
          });
      },

      // Returns the response..
      function(callback) {
        return callback(null, response);
      }

    ], ctrl.asyncCallback(deferred));
    return deferred.promise;
  }

}

module.exports = new PostController();
