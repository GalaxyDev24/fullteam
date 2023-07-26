"use strict";

/* jshint esversion: 6 */

var q = require('q'),
    knex = require('lib/knex'),
    async               = require('async'),
    NotificationService = require('services/notification-service'),
    ChatService = require('services/chat-service'),
    Controller = require('controllers/controller');

class SandboxController extends Controller {

  constructor() {
    super(null);
  }

  fn(request, response, app) {
    response = {};
    var ctrl = this;
    var deferred = q.defer();

    knex.select(['id']).from('user').then(function(results){

      var ids = results.map(function(result){
        return result.id;
      });

      async.mapLimit(ids, 1, function(id, callback) {
        ChatService.getChatSession(id).then(function(success){
          callback(null, success);
        }, function(error){
          callback(null, error);
        });
      }, function(err, results) {
        console.log(err);
        console.log(results);
        deferred.resolve({ 'Success' : 0 });
      });
    });

    // ChatService.getChatSession(4).then(function(arg) {
    //   console.log(arg);
    // }, function(err) {
    //   console.log(err);
    // });

    return deferred.promise;
  }

  fn2(request, response, app) {
    response = {};
    var deferred = q.defer();

    knex('teams')
    .innerJoin('user_chat_sessions', 'user_chat_sessions.user_id', 'teams.manager_id')
    .orderBy('teams.id', 'asc')
    .then(function(teams){
      async.mapLimit(teams, 1, function(team, callback) {
        var teamID = team.id;
        var managerID = team.manager_id;
        var chatManagerID = team.chat_user_id;
        var teamName = team.name;

        knex.select(['user_chat_sessions.chat_user_id'])
        .from('team_players')
        .innerJoin('user_chat_sessions', 'user_chat_sessions.user_id', 'team_players.user_id')
        .where('team_players.team_id', teamID)
        .then(function(teamPlayers){
          var userIDs = [];
          if (typeof teamPlayers !== 'undefined') {
            userIDs = teamPlayers.map(function(result){
              return result.chat_user_id;
            });
          }

          if (userIDs.indexOf(chatManagerID) < 0) {
            userIDs.push(chatManagerID);
          }

          ChatService.getChatSession(managerID).then(function(result) {
            var teamManagerQB = result.QB;

            var params = {
              type: ChatService.DIALOG_TYPE_GROUP,
              occupants_ids: userIDs,
              name: teamName + "'s Group Chat",
              data: {
                class_name: "TeamDialog",
                team_id: teamID
              },
            };

            teamManagerQB.chat.dialog.create(params, function(err, createdDialog) {
              if (err) {
                console.log(err);
                callback(null, err);
              }

              console.log('Manager Created Team Dialog.');
              console.log(createdDialog);

              knex('teams')
                .where('id', teamID)
                .update({'chat_dialog_id': createdDialog._id})
                .then(function() {
                  callback(null, true);
                }, function(err) {
                  callback(null, err);
                });

            });

          }, function(error) {
            console.log("Could not create team manager's chat session...");
            callback(null, error);
          });
        });
        
      }, function(err, results) {
        console.log(err);
        console.log(results);
        deferred.resolve({ 'Success' : 0 });
      });
    });
  }

  updateGroupChatPhoto(request, response, app) {
    response = {};
    var ctrl = this;
    var deferred = q.defer();

    knex('teams')
    .orderBy('id', 'asc')
    .then(function(teams){
      async.mapLimit(teams, 1, function(team, callback) {
        var teamID = team.id;
        var managerID = team.manager_id;
        var chatDialogID = team.chat_dialog_id;
        var teamPicture = team.picture;

        ChatService.getChatSession(managerID).then(function(result) {
          var teamManagerQB = result.QB;
          var params = {
            photo: teamPicture
          };

          teamManagerQB.chat.dialog.update(chatDialogID, params, function(err, res) {
            if (err) {
              console.log(err);
              callback(null, err);
              return;
            }

            callback(null, true);
          });

        }, function(error) {
          console.log("Could not create team manager's chat session...");
          callback(null, error);
        });
        
      }, function(err, results) {
        console.log(err);
        console.log(results);
        deferred.resolve({ 'Success' : 0 });
      });
    });

    return deferred.promise;
  }
}

module.exports = new SandboxController();
