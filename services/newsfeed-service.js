"use strict";

/* jshint esversion: 6 */

var knex = require('lib/knex');
var config = require('config');
var moment = require('moment');
var urlFixer = require('helpers/url-fixer');
var twitterService = require('services/twitter-service');
var async = require('async');
var q = require('q');

class NewsfeedService {

    static createSystemPost(userIdOrData, postTitle, postContent, postType, postParentID, postParentType, postMeta) {

      var userID;
      if(typeof userIdOrData === 'object') {
        var args = userIdOrData;
        userID = args.userID;
        postTitle = args.postTitle;
        postContent = args.postContent;
        postType = args.postType;
        postParentID = args.postParentID;
        postParentType = args.postParentType;
        postMeta = args.postMeta;
      } else {
        userID = userIdOrData;
      }

      return new Promise(function(resolve, reject) {
        var now = moment();
        var nowFormatted = now.format("YYYY-MM-DD HH:mm:ss");
        var data = {
          user_id: userID,
          post_title: postTitle,
          post_content: postContent,
          post_status: "publish",
          comment_status: "open",
          post_parent_id: postParentID,
          post_parent_type: postParentType,
          post_type: postType,
          created_at: now.format("YYYY-MM-DD HH:mm:ss"),
          updated_at: null,
          system: true,
          time: now.valueOf(),
        };

        knex('posts').insert(data, 'id').then(function(ids) {

          var post_meta_rows = [];
          if(!ids.length) {
            return reject('Could not create post');
          }
          
          var post_id = ids[0];

          if(typeof postMeta === 'undefined') {
            return resolve(post_id);
          }

          
          for(var key in postMeta) {
            if(postMeta.hasOwnProperty(key)) {
              post_meta_rows.push({
                post_id: post_id,
                meta_key: key,
                meta_value: postMeta[key],
                created_at: nowFormatted,
                updated_at: null,
              });
            }
          }

          if (!post_meta_rows.length) {
            return resolve(post_id);
          }

          knex.batchInsert('post_meta', post_meta_rows).then(function(newIDs){
            return resolve(post_id);
          }, function(error){
            return reject(error);
          });

        }, function(error) {
          reject(error);
        });

      });
    }

    static commentsTransformerGenerator(currentUserID, cache) {
      var comment_likes = cache.comment_likes;

      return function(item) {
        var comment = {};
        comment.ID = item.ID;
        comment.Content = item.Content;
        comment.CreatedAt = item.CreatedAt;

        comment.NumberOfLikes = comment_likes.filter(function(comment_like){
          return comment_like.comment_id === item.ID;
        }).length;

        comment.LikedByCurrentUser = comment_likes.filter(function(comment_like){
          return comment_like.user_id === currentUserID && comment_like.comment_id === item.ID;
        }).length > 0;

        comment.User = {
          'UserID': item.UserID,
          'CurrentUser': item.UserID === currentUserID,
          'UserPictureURL': item.UserPictureURL,
          'UserFullName': item.UserFirstName + ' ' + item.UserLastName
        };
        return comment;
      };
    }

    static likedByTransformerGenerator(currentUserID, cache) {
      return function(item) {
        var likedBy = {};
        likedBy = {
          'UserID': item.UserID,
          'CurrentUser': item.UserID === currentUserID,
          'UserPictureUrl': item.UserPictureURL,
          'UserFullName': item.UserFullName,
          'Gender': item.UserGender,
          'CreatedAt': item.CreatedAt
        };
        return likedBy;
      };
    }

    static additionalDataTransformerGenerator(currentUserID, cache) {
      return function(item) {
        return {
          key: item.meta_key,
          value: item.meta_value,
        };
      };
    }

    static userTransformer(currentUserID, user) {
      return {
        'UserID': user.UserID,
        'CurrentUser': user.UserID === currentUserID,
        'UserPictureURL': user.UserPictureURL,
        'UserFullName': user.UserFullName,
        'UserGender': user.UserGender,
      };
    }

    static newsfeedTransformerGenerator(currentUserID, cache) {
      var self = this;
      var comments = cache.comments;
      var post_likes = cache.likes;
      var post_meta = cache.post_meta;
      var post_parents = cache.post_parents;

      return function(result) {
        var post = {};

        post.PostID = result.PostID;
        post.PostType = result.PostType;
        post.CreatedAt = result.CreatedAt;
        post.Timestamp = result.CreatedAt;
        post.PostTitle = result.PostTitle;
        post.PostContent = result.PostContent;
        post.PostStatus = result.PostStatus;
        post.PostParentID = result.PostParentID;
        post.PostParentType = result.PostParentType;
        post.FeedbackMessage = result.FeedbackMessage;
        post.AverageRating = result.AverageRating;
        post.Reliability = result.Reliability;
        post.Fitness = result.Fitness;
        post.Shooting = result.Shooting;
        post.Passing = result.Passing;

        for(var i = 0; i < post_parents.length; i++) {
          if ((post_parents[i].Type === result.PostParentType) && (post_parents[i].ID === result.PostParentID)) {
            post.PostParentName = post_parents[i].Name;
            post.PostTeamManager = post_parents[i].TeamManager;
          }
        }

        if (post.PostType === 'photo') {
          // Temporary fix for old builds of IOS and ANDROID.
          post.PostContent = urlFixer(post.PostContent);
        }

        post.User = self.userTransformer(currentUserID, result);

        post.NumberOfLikes = post_likes.filter(function(item) {
          return item.PostID === result.PostID;
        }).length;

        post.LikedByCurrentUser = post_likes.filter(function(item) {
          return item.UserID === currentUserID && item.PostID === result.PostID;
        }).length > 0;

        post.LikedBy = post_likes.filter(function(item) {
          return item.PostID === result.PostID;
        }).map(self.likedByTransformerGenerator(currentUserID, cache));

        post.Comments = comments.filter(function(item) {
          return item.PostID === result.PostID;
        }).map(self.commentsTransformerGenerator(currentUserID, cache));

        post.NumberOfComments = post.Comments.length;

        post.AdditionalData = post_meta.filter(function(item) {
          return item.post_id === post.PostID;
        }).map(self.additionalDataTransformerGenerator(currentUserID, cache));

        if(post.PostParentType === 'news_source' && post.PostType === 'twitter_status') {
          post.UserFullName = 'FullTeam Twitter';
          post.UserPictureURL = config.baseUrl + 'UserUploads/twitter-bird.png';
          post.User.UserID = 0;
          post.User.CurrentUser = false;
          post.User.UserPictureURL = post.UserPictureURL;
          post.User.UserFullName = post.UserFullName;
          post.User.UserGender = 1;


          for(var j = 0; j < post.AdditionalData.length; j++) {
            console.log(post.AdditionalData[j].key);
            if (post.AdditionalData[j].key === 'tweet_json') {
              
              var tweet = JSON.parse(post.AdditionalData[j].value);
              post.Tweet = twitterService.parse(tweet);
              break;
            }
          }
        }


        return post;
      };
    }


    static getPostLikesCache(postIDs){
      return knex
        .select([
          'post_likes.post_id AS PostID',
          'post_likes.user_id AS UserID',
          'post_likes.like_type AS LikeType',
          'post_likes.created_at AS CreatedAt',
          knex.raw('CONCAT(reg_info.name, " ", reg_info.last_name) AS UserFullName'),
          'reg_info.picture AS UserPictureURL',
          'user.gender AS UserGender',
        ])
        .from('post_likes')
        .innerJoin('reg_info', 'post_likes.user_id', 'reg_info.user_id')
        .innerJoin('user', 'post_likes.user_id', 'user.id')
        .whereIn('post_likes.post_id', postIDs);
    }

    static getPostCommentsCache(postIDs) {
      return knex.select([
          'comments.id as ID',
          'comments.content as Content',
          'comments.post_id as PostID',
          'comments.parent_id as CommentParentID',
          'comments.created_at as CreatedAt',
          'reg_info.user_id as UserID',
          'reg_info.name as UserFirstName',
          'reg_info.last_name as UserLastName',
          'reg_info.picture as UserPictureURL',
        ])
        .from('comments')
        .innerJoin('user', 'comments.user_id', 'user.id')
        .innerJoin('reg_info', 'reg_info.user_id', 'user.id')
        .whereIn('comments.post_id', postIDs)
        .whereNull('comments.deleted_at');
    } 

    static getPostParentsCache(teamIDs, userIDs) {
      return knex.select([
            "teams.id AS ID",
            "teams.name AS Name",
            knex.raw("'team' AS Type"),
            "teams.manager_id AS TeamManager",
          ])
          .from('teams')
          .whereIn('teams.id', teamIDs)
          .whereNull('teams.deleted_at')
          .unionAll(function(){
            this
              .select([
                "reg_info.user_id AS ID",
                knex.raw("CONCAT_WS(' ', reg_info.name, reg_info.last_name) AS Name"),
                knex.raw("'user' AS Type"),
                knex.raw("0 AS TeamManager"),
              ])
              .from('reg_info')
              .whereIn('reg_info.user_id', userIDs);
          }, true)
    }

    static getPostMetaCache(postIDs) {
      return knex.select()
          .from('post_meta')
          .whereIn('post_meta.post_id', postIDs);
    }

    static getCommentLikesCache(currentUserID, cache) {
      var comments = cache.comments;
      var commentIDs = comments.map(function(comment) {
        return comment.ID;
      });
      return knex.select()
          .from('comment_likes')
          .where('comment_likes.like_type', 'like')
          .where('comment_likes.user_id', currentUserID)
          .whereIn('comment_likes.comment_id', commentIDs)
          .whereNull('comment_likes.deleted_at');
    }

    static getProfilePosts(currentUserID, data) {
      return knex
          .select([
            'posts.id AS PostID',
            'posts.user_id AS UserID',
            'posts.post_title AS PostTitle',
            'posts.post_content AS PostContent',
            'posts.post_status AS PostStatus',
            'posts.post_parent_id AS PostParentID',
            'posts.post_parent_type AS PostParentType',
            'posts.post_type AS PostType',
            'posts.created_at AS CreatedAt',
            'posts.updated_at AS UpdatedAt',
            knex.raw('CONCAT(reg_info.name, " ", reg_info.last_name) AS UserFullName'),
            'reg_info.picture AS UserPictureURL',
            'user.gender AS UserGender',
          ])
          .from('posts')
          .innerJoin('user', 'posts.user_id', 'user.id')
          .innerJoin('reg_info', 'reg_info.user_id', 'user.id')
          .where('posts.post_parent_type', data.PostParentType)
          .where('posts.post_parent_id', data.PostParentID)
          .whereNull('posts.deleted_at')
          .where(function(){
            if(data.LastPostID) {
              this.whereRaw("posts.time <= (select posts.time from posts where posts.id = ?) AND posts.id <> ?", [data.LastPostID, data.LastPostID]);
            }
          })
          .orderBy('posts.time', 'desc')
          .limit(10);
    }

    static getNewsfeedPosts(currentUserID, data) {
      return knex
          .select([
            'posts.user_id AS UserID',
            'posts.id AS PostID',
            'posts.post_title AS PostTitle',
            'posts.post_content AS PostContent',
            'posts.post_status AS PostStatus',
            'posts.post_parent_id AS PostParentID',
            'posts.post_parent_type AS PostParentType',
            'posts.post_type AS PostType',
            'posts.created_at AS CreatedAt',
            'posts.updated_at AS UpdatedAt',
            knex.raw('CONCAT(reg_info.name, " ", reg_info.last_name) AS UserFullName'),
            'reg_info.picture AS UserPictureURL',
            'user.gender AS UserGender',
            knex.raw('(SELECT meta_value FROM post_meta WHERE post_id = posts.id AND meta_key = \'FeedbackMessage\') AS FeedbackMessage'),
            knex.raw('(SELECT meta_value FROM post_meta WHERE post_id = posts.id AND meta_key = \'AverageRating\') AS AverageRating'),
            knex.raw('(SELECT meta_value FROM post_meta WHERE post_id = posts.id AND meta_key = \'Reliability\') AS Reliability'),
            knex.raw('(SELECT meta_value FROM post_meta WHERE post_id = posts.id AND meta_key = \'Fitness\') AS Fitness'),
            knex.raw('(SELECT meta_value FROM post_meta WHERE post_id = posts.id AND meta_key = \'Shooting\') AS Shooting'),
            knex.raw('(SELECT meta_value FROM post_meta WHERE post_id = posts.id AND meta_key = \'Passing\') AS Passing'),
          ])
          .from('posts')
          .leftJoin('user_followers', 'user_followers.user_id', 'posts.user_id')
          .leftJoin('reg_info', 'user_followers.user_id', 'reg_info.user_id')
          .leftJoin('user', 'user_followers.user_id', 'user.id')
          .where(function() {
            this.where('user_followers.follower_id', currentUserID)
                .orWhere('posts.post_parent_type', 'news_source');
          })
          .where(function() {
            this.where('user_followers.user_id', '<>', currentUserID)
                .orWhere('posts.post_parent_type', 'news_source');
          })
          .whereRaw('posts.id NOT IN (SELECT posts.id FROM posts WHERE (posts.post_type = \'following\' OR posts.post_type = \'rating\') AND posts.post_parent_type = \'user\' AND posts.post_parent_id = ?)', [currentUserID])
          .whereNull('posts.deleted_at')
          .where(function(){
            if(data.LastPostID) {
              this.whereRaw("posts.time <= (select posts.time from posts where posts.id = ?) AND posts.id <> ?", [data.LastPostID, data.LastPostID]);
            }
          })
          // .debug()
          .groupBy('posts.id')
          .orderBy('posts.time', 'desc')
          .limit(10);
    }

    static transformPostResults(currentUserID, posts) {

      var postIDs = [];
      var userIDs = [];
      var teamIDs = [];
      var cache = {};
      var deferred = q.defer();

      for (var i = 0; i < posts.length; i = i + 1) {
        postIDs.push(posts[i].PostID);
        if(posts[i].PostParentType === 'user') {
          userIDs.push(posts[i].PostParentID);  
        } else if(posts[i].PostParentType === 'team') {
          teamIDs.push(posts[i].PostParentID);  
        } 
      }

      async.waterfall([
        // Get post likes number and liked by
        function(callback) {
          NewsfeedService.getPostLikesCache(postIDs).then(function(likes) {
              cache.likes = typeof likes === 'undefined' ? [] : likes;
              return callback(null);
            }, function(err) {
              return callback([1, "Could not retrieve post likes.", err]);
            });
        },

        // Get post comment
        function(callback) {
            NewsfeedService.getPostCommentsCache(postIDs).then(function(comments) {
              cache.comments = (typeof comments === 'undefined') ? [] : comments;
              return callback(null);
            }, function(err) {
              return callback([1, "Could not retrieve comments.", err]);
            });
        },

        // get post parents
        function(callback) {
            NewsfeedService.getPostParentsCache(teamIDs, userIDs).then(function(post_parents) {
              cache.post_parents = (typeof post_parents === 'undefined') ? [] : post_parents;
              return callback(null);
            }, function(err) {
              return callback([1, "Could not retrieve post parents.", err]);
            });
        },
        // get post meta
        function(callback) {
          NewsfeedService.getPostMetaCache(postIDs).then(function(post_meta) {
            cache.post_meta = (typeof post_meta === 'undefined') ? [] : post_meta;
            return callback(null);
          }, function(err) {
            return callback([1, "Could not retreive post meta.", err]);
          });
        },
        // get comment likes
        function(callback) {
          NewsfeedService.getCommentLikesCache(currentUserID, cache).then(function(comment_likes) {
            cache.comment_likes = (typeof comment_likes === 'undefined') ? [] : comment_likes;
            return callback(null);
          }, function(err) {
            console.log(err);
            return callback([1, "User does not exist.", err]);
          });
        },

        // Returns the response..
        function(callback) {
          var transformedPosts = posts.map(NewsfeedService.newsfeedTransformerGenerator(currentUserID, cache));
          return callback(null, transformedPosts);
        }
      ], function(err, results) {

        if (err) {
          deferred.reject(err);
          return;
        }

        deferred.resolve(results);
      });

      return deferred.promise;
    }

    static checkIfCanViewPosts(currentUserID, data) {
      var deferred = q.defer();

      if (data.PostParentType === 'user' && data.PostParentID !== currentUserID) {

        return knex.select()
          .from('user_followers')
          .where('follower_id', currentUserID)
          .where('user_id', data.PostParentID);

      } else if (data.PostParentType === 'team') {

        return knex.select(['follower_id', 'team_id'])
          .from('team_followers')
          .where('follower_id', currentUserID)
          .where('team_id', data.PostParentID)
          .union(function(){
            this.select(['id', 'manager_id'])
              .from('teams')
              .where('manager_id', currentUserID)
              .where('id', data.PostParentID);
          })
          .union(function(){
            this.select(['team_id', 'user_id'])
              .from('team_players')
              .where('user_id', currentUserID)
              .where('team_id', data.PostParentID);
          });

      }

      return q.when(true);

    }

    static getUserIDs(commentID, postID, currentUserID) {
      if (typeof commentID === 'undefined') {
        return false;
      }

      if (typeof commentID === 'undefined') {
        return false;
      }

      if (typeof commentID === 'undefined') {
        return false;
      }

      return knex.raw(
            " SELECT DISTINCT a.user_id as user_id FROM "
          + " ( SELECT user_id  FROM comments "
          + " WHERE "
          + " ((? <> 0 OR (? = 0 AND post_id = ?)) "
          + " AND parent_id = ?) OR (id = ?) "
          + " UNION "
          + " SELECT "
          + " CASE WHEN post_parent_type = 'user' THEN post_parent_id ELSE ( "
          + " SELECT manager_id FROM teams WHERE id = post_parent_id "
          + " ) END AS user_id "
          + " FROM posts "
          + " WHERE id = ? "
          + " UNION "
          + " SELECT user_id FROM posts WHERE "
          + " id = ? ) a "
          + " WHERE a.user_id <> ?", 
           [commentID, commentID, postID, commentID, commentID, postID, postID, currentUserID]);
    }
}

module.exports = NewsfeedService;