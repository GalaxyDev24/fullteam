"use strict";

/* jshint esversion: 6 */

var knex = require('lib/knex');
var config = require('config');
var QuickBlox = require('quickblox').QuickBlox;
var async = require('async');
var q = require('q');
var md5 = require('md5');
var FullteamError = require('helpers/fullteam-error.js');

class ChatService {

  static errorCallback(callback, description, reason) {
    if (typeof description === 'undefined') {
      return callback(null);
    }

    if (!String(description).length) {
      return callback(null);
    }
    
    return callback(new FullteamError(description, reason));
  }

  static getChatSession(userID) {
    var response = {};
    var QB = new QuickBlox();
    var deferred = q.defer();

    QB.init(config.quickblox.appId, config.quickblox.authKey, config.quickblox.authSecret);

    async.waterfall([
      // Get the user
      function(callback) {

        knex.select([
            'id as user_id',
            'email as user_email',
            'user_chat_sessions.password as chat_password',
            'user_chat_sessions.chat_user_id as chat_user_id',
            'user_chat_sessions.token as chat_token',
            'reg_info.name as first_name',
            'reg_info.last_name as last_name',
            'reg_info.picture as picture_url',
          ])
          .from('user')
          .innerJoin('reg_info', 'user.id', '=', 'reg_info.user_id')
          .leftJoin('user_chat_sessions', 'user.id', '=', 'user_chat_sessions.user_id')
          .where('user.id', userID)
          .first()
          .then(function(chatSession) {

            if (typeof chatSession === 'undefined') {
              return ChatService.errorCallback(callback, "Could not retreive user from database.");
            }

            return callback(null, chatSession);

          }, function(err) {
            return ChatService.errorCallback(callback, "Could not retreive chat session from database.", err);
          });
      },


      function(chatSession, callback) {

        if (chatSession.chat_password) {
          return callback(null, chatSession);
        }

        chatSession.chat_password = md5('fullteamtest-' + chatSession.user_email); //randtoken.generate(32);
        chatSession.chat_user_id = null;
        chatSession.chat_token = null;

        knex('user_chat_sessions')
          .insert({
            user_id: userID,
            password: chatSession.chat_password,
            chat_user_id: chatSession.chat_user_id,
            token: chatSession.chat_token,
          })
          .then(function(id) {
            return callback(null, chatSession);
          }, function(err) {
            return ChatService.errorCallback(callback, "Could not create chat session in database", err);
          });

      },

      function(chatSession, callback) {

        QB.createSession(function(sessionError, sessionResult) {

          if (sessionError) {
            return ChatService.errorCallback(callback, "Could not retrieve chat session.", sessionError);
          }

          if (!chatSession.chat_user_id) {

            var params = {
              email: chatSession.user_email,
              login: chatSession.user_email,
              password: chatSession.chat_password,
              external_user_id: userID,
              full_name: chatSession.first_name + ' ' + chatSession.last_name,
            };

            QB.users.create(params, function(err, user) {
              if (user) {
                // success
                chatSession.chat_user_id = user.id;

                knex('user_chat_sessions')
                  .where('user_id', userID)
                  .update({
                    'chat_user_id': chatSession.chat_user_id,
                  })
                  .then(function() {
                    return callback(null, chatSession);
                  }, function(err) {
                    return ChatService.errorCallback(callback, "User chat session could not be updated.");
                  });

              } else {

                if (err && err.detail && err.detail.login && err.detail.login[0] === 'has already been taken') {
                  return callback(null, chatSession);
                }

                return ChatService.errorCallback(callback, "Could not create user on chat api.", err);
              }
            });

            return;

          }

          return callback(null, chatSession);

        });

      },

      function(chatSession, callback) {

        var params = {
          login: chatSession.user_email,
          password: chatSession.chat_password
        };

        console.log('<<<< chatSession::params');
        console.log(params);
        console.log('>>>> chatSession::params');

        QB.login(params, function(loginError, loginResult) {

          if (loginError) {
            return ChatService.errorCallback(callback, "Could not login to chat session.", loginError);
          }

          chatSession.chat_user_id = loginResult.id;

          return callback(null, chatSession);

        });

      },

      function(chatSession, callback) {
        var custom_data = JSON.stringify({
          picture_url: chatSession.picture_url
        });

        var params = {
          custom_data: custom_data
        };

        QB.users.update(chatSession.chat_user_id, params, function(err, user) {
          return callback(null, chatSession);
        });

      },

      function(chatSession, callback) {

        QB.getSession(function(error, result) {

          if (error) {
            return ChatService.errorCallback(callback, "Could not retreive chat session.", error);
          }

          // console.warn('<< CHAT SESSION');
          // console.warn(result);
          // console.warn('>> END CHAT SESSION');

          knex('user_chat_sessions')
            .where('user_id', userID)
            .update({
              'token': result.session.token,
              'chat_user_id': result.session.user_id,
            })
            .then(function() {
              response.QB = QB;
              response.Session = result.session;
              return callback(null);
            }, function(error) {
              return ChatService.errorCallback(callback, "User chat session could not be updated (2).", error);
            });
        });
      },

      // Returns the response..
      function(callback) {
        return callback(null, response);
      },

    ], function(err, result) {
      if (err) {
        deferred.reject(err);
        return;
      }

      console.log('result');
      console.log(result);
      console.log('-------------');

      deferred.resolve(result);
    });

    return deferred.promise;

  }

}

ChatService.DIALOG_TYPE_GROUP = 2;

module.exports = ChatService;