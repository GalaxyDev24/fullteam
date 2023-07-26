var knex = require('lib/knex');
var q = require('q');
var _ = require('lodash');
var config = require('config');
var async = require('async');
var util = require('util');
var moment = require('moment');
var validate = require("validate.js");
var log = require('helpers/logger');
var suid = require('rand-token').suid;
var urlFixer = require('helpers/url-fixer');

var firebase = require('helpers/firebase');
var Controller = require('controllers/controller');
var TeamService = require('services/team-service');
var ChatService = require('services/chat-service');
var NewsfeedService = require('services/newsfeed-service');
var NotificationService = require('services/notification-service');

function TeamController() {
  var ctrl = new Controller(this);

  var singleTeamIDRequestConstraints = {
    TeamID: {
      presence: {
        message: "is required"
      },
      numericality: {
        onlyInteger: true,
        greaterThan: 0
      }
    }
  };


  var teamPlayersTransformerGenerator = function() {
    return function(result) {
      var player = {};
      player.Confirmed = result.confirmed;
      player.FirstName = result.first_name;
      player.LastName = result.last_name;
      player.PictureURL = result.picture;
      player.PositionID = result.position;
      player.UserID = result.user_id;
      player.TeamID = result.team_id;
      return player;
    };
  };

  var teamTransformerGenerator = function(userID, teamPlayers) {
    return function(result) {
      var team = {};
      team.TeamID = result.id;
      team.TeamName = result.name;
      team.isOwnTeam = result.manager_id === userID;
      team.PictureURL = result.picture;
      team.Players = teamPlayers.filter(function(item) {
        return result.id === item.team_id;
      }).map(teamPlayersTransformerGenerator());

      return team;
    };
  };

  var getTeamsPlayers = function(teams) {
    var teamIDs = [];
    for (var i = 0; i < teams.length; i++) {
      teamIDs.push(teams[i].id);
    }

    return knex.select([
        knex.raw('1 as confirmed'), 
        'team_players.team_id AS team_id', 
        'team_players.user_id AS user_id', 
        'team_players.position AS position', 
        'reg_info.picture AS picture',
        'reg_info.name AS first_name',
        'reg_info.last_name AS last_name'
      ])
      .from('team_players')
      .innerJoin('teams', 'teams.id', 'team_players.team_id')
      .innerJoin('reg_info', 'reg_info.user_id', 'team_players.user_id')
      .whereIn('team_id', teamIDs)
      .whereNull('teams.deleted_at')
      .union(function(){
        this.select([
          knex.raw('0 as confirmed'), 
          'team_invites.team_id AS team_id', 
          'team_invites.user_id AS user_id', 
          'team_invites.position AS position', 
          'reg_info.picture AS picture',
          'reg_info.name AS first_name',
          'reg_info.last_name AS last_name'
        ])
        .from('team_invites')
        .innerJoin('teams', 'teams.id', 'team_invites.team_id')
        .innerJoin('reg_info', 'reg_info.user_id', 'team_invites.user_id')
        .whereIn('team_id', teamIDs)
        .whereNull('teams.deleted_at');
      });
  };

  this.createTeam = function(request) {
    var data = request.data;
    var response = {};

    var chatUserID = null;

    var createTeamRequestConstraints = {
      Name: {
        presence: {
          message: "is required"
        }
      },
      TeamSize: {
        presence: {
          message: "is required"
        },
        inclusion: [6, 11, "6", "11"]
      },
      Lat: {
        numericality: true
      },
      Lon: {
        numericality: true
      }
    };

    var deferred = q.defer();
    var insertObject = {};

    async.waterfall([
      // Data validation...
      function(callback) {
        var errors = validate(data, createTeamRequestConstraints);
        if (errors) {
          return ctrl.errorCallback(callback, 1, "Invalid Parameters", errors);
        }
        return callback(null);
      },

      // Profile Picture
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

        fs.writeFile('public/UserUploads/TeamPictures/' + filename, buf, function(err) {
          if (err) {
            return callback(err);
          }
          insertObject.picture = config.baseUrl + 'UserUploads/TeamPictures/' + filename;
          callback(null);
        });

      },

      // Cover Picture
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

        fs.writeFile('public/UserUploads/TeamPictures/' + filename, buf, function(err) {
          if (err) {
            log.error(err);
            return ctrl.errorCallback(callback, 1, "Failed to write team picture to disk", err);
          }
          insertObject.cover_picture = config.baseUrl + 'UserUploads/TeamPictures/' + filename;
          callback(null);
        });

      },

      // Get user location
      function(callback) {
        if (data.Lat && data.Lon) {
          insertObject.lat = data.Lat;
          insertObject.lon = data.Lon;
          return callback(null, insertObject);
        }

        knex.select(['user_location.lat', 'user_location.lon', ])
          .from('user')
          .innerJoin('user_location', 'user_location.user_id', 'user.id')
          .where('id', request.userID)
          .first()
          .then(function(userLocation) {
            if (typeof userLocation === 'undefined') {
              return ctrl.errorCallback(callback, 1, "User location not found");
            }
            return callback(null, userLocation);
          }, function(err) {
            return ctrl.errorCallback(callback, 1, "User location does not exist.", err);
          });

      },

      // Get user chat id
      function(userLocation, callback) {
        knex.select(['user_chat_sessions.chat_user_id'])
          .from('user_chat_sessions')
          .where('user_id', request.userID)
          .first()
          .then(function(userChatSession) {
            if (typeof userChatSession === 'undefined') {
              return ctrl.errorCallback(callback, 1, "User chat id not found");
            }

            chatUserID = userChatSession.chat_user_id;
            return callback(null, userLocation);
          }, function(err) {
            return ctrl.errorCallback(callback, 1, "Error finding chat user id", err);
          });

      },

      // Create the team
      function(userLocation, callback) {

        if (typeof insertObject.lat === 'undefined') {
          insertObject.lat = userLocation.lat;
        }

        if (typeof insertObject.lon === 'undefined') {
          insertObject.lon = userLocation.lon;
        }

        insertObject.manager_id = request.userID;
        insertObject.name = data.Name;
        insertObject.team_size = data.TeamSize;
        insertObject.formation = data.TeamSize === 11 ? '4-4-2' : '2-2-1';
        insertObject.created_at = moment().format("YYYY-MM-DD HH:mm:ss");
        insertObject.updated_at = moment().format("YYYY-MM-DD HH:mm:ss");

        knex('teams')
          .insert(insertObject)
          .then(function(teamIDs) {

            if (teamIDs.length) {
              response.TeamID = teamIDs[0];
              return callback(null);
            }

            return ctrl.errorCallback(callback, 1, "Team was not created.");

          }, function(err) {
            log.error(err);
            return ctrl.errorCallback(callback, 1, "Team could not be created.");
          });

      },

      // Insert team manager to team_players
      function(callback) {
        var insertTeamPlayerObject = {};
        if (typeof insertObject.manager_id === 'undefined' || typeof response.TeamID === 'undefined') {
          return callback(null);
        }

        insertTeamPlayerObject.team_id = response.TeamID;
        insertTeamPlayerObject.user_id = insertObject.manager_id;
        insertTeamPlayerObject.position = 11;
        insertTeamPlayerObject.finances = 0;

        knex('team_players')
          .insert(insertTeamPlayerObject)
          .then(function(players) {

            if (players.length) {
              return callback(null);
            }

            return ctrl.errorCallback(callback, 1, "Team was not created.");

          }, function(err) {
            log.error(err);
            return ctrl.errorCallback(callback, 1, "Team could not be created.");
          });

      },

      function(callback) {
        var pictureURL = config.baseUrl + 'UserUploads/TeamPictures/team-placeholder.png';
        if (insertObject.picture) {
          pictureURL = insertObject.picture;
        }

        var params = {
          type: ChatService.DIALOG_TYPE_GROUP,
          occupants_ids: [chatUserID],
          name: data.Name + "'s Group Chat",
          photo: pictureURL,
          data: {
            class_name: "TeamDialog",
            team_id: response.TeamID
          },
        };

        ChatService.getChatSession(request.userID).then(function(result) {
          var teamManagerQB = result.QB;
          teamManagerQB.chat.dialog.create(params, function(err, createdDialog) {
            if (err) {
              console.log(err);
              return callback(err);
            }

            knex('teams')
              .where('id', response.TeamID)
              .update({'chat_dialog_id': createdDialog._id})
              .then(function() {
                return callback(null);
              }, function(err) {
                return ctrl.errorCallback(callback, 1, "Team chat dialog id could not be updated", err);
              });

            //return callback(null);
          });

        }, function(error) {
          console.log("Could not retreive team manager's chat session...");
          return callback(error);
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
            return ctrl.errorCallback(callback, 1, "Unknown error", err);
          });
      },

      // Insert data to posts
      function(firstName, lastName, pictureURL, callback) {
        var team = {
          'TeamID': response.TeamID,
          'TeamName': data.Name
        };

        var notification = {
          type: NotificationService.notificationTypes.TEAM_CREATED,
          timestamp: (new Date()).getTime(),
          data: JSON.stringify({
            'UserID': request.userID,
            'FirstName': firstName,
            'LastName': lastName,
            'PictureURL': pictureURL
          }),
        };

        return Promise.all([
          NewsfeedService.createSystemPost({
            'userID': request.userID, 
            'postTitle': "created a new team", 
            'postContent': '', 
            'postType': 'team creating', 
            'postParentID': request.userID, 
            'postParentType': 'user', 
            'postMeta': team
          }),
          NotificationService.sendNotifications(
            [request.userID],
            notification,
            "New team created!"),
        ]).then(function() {
          return callback(null);
        }, function(err) {
          console.log(err);
          ctrl.errorCallback(callback, 1, "Error sending notification", err);
        });
      },

      // Returns the response..
      function(callback) {
        return callback(null, response);
      },



    ], ctrl.asyncCallback(deferred));
    return deferred.promise;
  };

  this.getOwnedTeams = function(request) {
    var response = {};
    var deferred = q.defer();

    async.waterfall([

      // Get user's owned teams
      function(callback) {
        knex.select()
          .from('teams')
          .where('manager_id', request.userID)
          .whereNull('deleted_at')
          .then(function(teams) {
            if (typeof teams === 'undefined') {
              teams = [];
            }
            
            return callback(null, teams);

          }, function(err) {
            console.log(err);
            return ctrl.errorCallback(callback, 1, "Cannot find user's teams.", err);
          });

      },

      // Get team players
      function(teams, callback) {
        getTeamsPlayers(teams).then(function(teamPlayers) {
          if (typeof teamPlayers === 'undefined') {
            teamPlayers = [];
          }
          return callback(null, teams, teamPlayers);
        }, function(err) {
          console.log(err);
          return ctrl.errorCallback(callback, 1, "Cannot find user's teams.");
        });
      },

      // Returns the response..
      function(teams, teamPlayers, callback) {
        response.Teams = teams.map(teamTransformerGenerator(request.userID, teamPlayers));
        return callback(null, response);
      },

    ], ctrl.asyncCallback(deferred));
    return deferred.promise;
  };

  this.getTeams = function(request) {
    var response = {};
    var deferred = q.defer();
    async.waterfall([
      // Get user's teams
      function(callback) {
        knex.select('teams.*')
          .from('teams')
          .innerJoin('team_players', 'team_players.team_id', 'teams.id')
          .where('team_players.user_id', request.userID)
          .whereNull('teams.deleted_at')
          .then(function(teams) {
            if (typeof teams === 'undefined') {
              teams = [];
            }

            response.Teams = teams.map(function(team){
              return {
                'TeamID': team.id,
                'TeamName': team.name,
              }
            });

            return callback(null);
          }, function(err) {
            return ctrl.errorCallback(callback, 1, "Cannot find user's teams.");
          });

      },

      // Returns the response..
      function(callback) {
        return callback(null, response);
      },

    ], ctrl.asyncCallback(deferred));
    return deferred.promise;
  };

  this.getAssociatedTeams = function(request) {

    var data = request.data;
    var response = {};
    var getAssociatedTeamsRequestConstraints = {
      UserID: {
        presence: {
          message: "is required"
        }
      }
    };

    var deferred = q.defer();
    async.waterfall([
      // Data validation...
      function(callback) {
        var errors = validate(data, getAssociatedTeamsRequestConstraints);
        if (errors) {
          return ctrl.errorCallback(callback, 1, "Invalid Parameters", errors);
        }
        return callback(null);
      },

      // SELECT DISTINCT teams.* from teams 
      // LEFT JOIN team_players on teams.id = team_players.team_id
      // WHERE ( team_players.user_id = 2 OR teams.manager_id = 2)

      // Get user's associated teams
      function(callback) {

        knex.select(knex.raw('DISTINCT  teams.*'))
          .from('teams')
          .leftJoin('team_players', 'team_players.team_id', 'teams.id')
          .whereRaw('(team_players.user_id = ? OR teams.manager_id = ?) AND teams.deleted_at IS NULL', [data.UserID, data.UserID])
          .then(function(teams) {
            if (typeof teams === 'undefined') {
              teams = [];
            }
            return callback(null, teams);
          }, function(err) {
            console.log(err);
            return ctrl.errorCallback(callback, 1, "Cannot find user's teams.", err);
          });

      },

      // Get team players
      function(teams, callback) {
        getTeamsPlayers(teams).then(function(teamPlayers) {
          if (typeof teamPlayers === 'undefined') {
            teamPlayers = [];
          }
          return callback(null, teams, teamPlayers);
        }, function(err) {
          console.log(err);
          return ctrl.errorCallback(callback, 1, "Cannot find user's teams.");
        });
      },

      // Returns the response..
      function(teams, teamPlayers, callback) {
        response.Teams = teams.map(teamTransformerGenerator(data.UserID, teamPlayers));
        return callback(null, response);
      },

    ], ctrl.asyncCallback(deferred));
    return deferred.promise;
  };

  this.inviteToTeam = function(request, response, app) {
    var data = request.data;
    var currentUser = null;

    validate.validators.teamInvitationUserIDs = TeamService.validateInvitationUserIDs;

    var inviteToTeamRequestConstraints = {
      TeamID: {
        presence: {
          message: "is required"
        },
        numericality: {
          onlyInteger: true,
          greaterThan: 0
        }
      },
      UserIDs: {
        presence: {
          message: "is required"
        },
        teamInvitationUserIDs: {},
      },
    };

    var deferred = q.defer();
    async.waterfall([
      // Data validation...
      function(callback) {
        var errors = validate(data, inviteToTeamRequestConstraints);
        if (errors) {
          return ctrl.errorCallback(callback, 1, "Invalid Parameters", errors);
        }
        return callback(null);
      },

      // Gets the current user.
      function(callback) {
        knex.select([
          'user.id as UserID',
          'user.gender as Gender',
          'reg_info.name as FirstName',
          'reg_info.last_name as LastName',
          'reg_info.picture as PictureURL',
        ])
          .from('user')
          .innerJoin('reg_info', 'reg_info.user_id', 'user.id')
          .where('user.id', request.userID)
          .first()
          .then(function(user) {
            if (typeof user === 'undefined') {
              return ctrl.errorCallback(callback, 1, "Cannot find current user details.");
            }
            currentUser = user;
            return callback(null);
          }, function(err) {
            return ctrl.errorCallback(callback, 1, "A database error has occurred. Make sure your parameters are correctly.", err);
          });
      },

      // Gets the team.
      function(callback) {
        TeamService
          .getTeam(data.TeamID, request.userID)
          .then(function(team) {
            if (typeof team === 'undefined') {
              return ctrl.errorCallback(callback, 1, "Team no longer exists!");
            }
            if (team.Manager != request.userID) {
              return ctrl.errorCallback(callback, 1, "You are not the manager of this team.");
            }
            return callback(null, team);
          }, function(err) {
            return ctrl.errorCallback(callback, 1, "A database error has occurred. Make sure your parameters are correctly.", err);
          });
      },

      // Get existing team players
      function(team, callback) {
        knex.select()
          .from('team_players')
          .innerJoin('teams', 'teams.id', 'team_players.team_id')
          .innerJoin('reg_info', 'reg_info.user_id', 'team_players.user_id')
          .where('team_players.team_id', data.TeamID)
          .whereNull('teams.deleted_at')
          .then(function(teamPlayers) {
            return callback(null, team, teamPlayers);
          }, function(err) {
            return ctrl.errorCallback(callback, 1, "A database error has occurred. Make sure your parameters are correctly.", err);
          });
      },

      // get existing team invites
      function(team, teamPlayers, callback) {
        knex.select()
          .from('team_invites')
          .innerJoin('teams', 'teams.id', 'team_invites.team_id')
          .innerJoin('reg_info', 'reg_info.user_id', 'team_invites.user_id')
          .where('team_invites.team_id', data.TeamID)
          .whereNull('teams.deleted_at')
          .then(function(teamInvites) {
            return callback(null, team, teamPlayers, teamInvites);
          }, function(err) {
            return ctrl.errorCallback(callback, 1, "A database error has occurred. Make sure your parameters are correctly.", err);
          });
      },

      // Update players and invites, send new invites if new
      function(team, teamPlayers, teamInvites, callback) {
        var existingUserIDs = teamPlayers.map(function(value, index) {
          return value.user_id;
        });

        var invitedUserIDs = teamInvites.map(function(value, index) {
          return value.user_id;
        });

        var tasks = [];
        var toInsert = [];

        data.UserIDs.forEach(function (player){
          var task = null;
          if (existingUserIDs.indexOf(player.UserID) !== -1) {
            task = knex('team_players')
                    .where('user_id', player.UserID)
                    .where('team_id', data.TeamID)
                    .update({
                      position: player.PositionID
                    });

            tasks.push(task);
            return;
          }

          if (invitedUserIDs.indexOf(player.UserID) !== -1) {
            task = knex('team_invites')
                    .where('user_id', player.UserID)
                    .where('team_id', data.TeamID)
                    .update({
                      position: player.PositionID
                    });

            tasks.push(task);
            return;
          }

          toInsert.push({
            team_id: data.TeamID,
            user_id: player.UserID,
            position: player.PositionID
          });

        });

        if (toInsert.length) {
          tasks.push(knex.batchInsert('team_invites', toInsert, 30));
        }

        // Update team "updated_at"
        var update = knex('teams')
                      .where('id', data.TeamID)
                      .update({
                        updated_at: moment().format("YYYY-MM-DD HH:mm:ss")
                      });

        tasks.push(update);

        Promise.all(tasks).then(function() {
          return callback(null, team, toInsert);
        }, function(err) {
          return ctrl.errorCallback(callback, 1, "A database error has occurred. Make sure your parameters are correctly.", err);
        });

      },

      // Send out notifications...
      function(team, toInsert, callback) {

        var notification = {
          timestamp: (new Date()).getTime(),
          type: NotificationService.notificationTypes.TEAMSHEET_INVITE,
          data: JSON.stringify({
            'TeamID': team.TeamID,
            'UserID': currentUser.UserID,
            'FirstName': currentUser.FirstName,
            'LastName': currentUser.LastName,
            'PictureURL': currentUser.PictureURL,
            'Gender': currentUser.Gender,
          }),
        };

        var IDs = toInsert.map(function(item) {
          return item.user_id;
        });

        var notifMessage = currentUser.FirstName + " " + currentUser.LastName +
          " has invited you to join " + team.TeamName;

        var notificationTask = NotificationService.sendNotifications(
            IDs, 
            notification,
            notifMessage,
            app
        );

        Promise.all([
          notificationTask,
        ]).then(function(values) {
          log.info('Notification tasks completed:');
          log.info(values);
        }).catch(function(err) {
          log.error('Notification tasks errored:');
          log.error(err);
        });

        // We dont need to wait for the notifications to be sent to return a response...
        return callback(null);
      },

      // Returns the response..
      function(callback) {
        response = {};
        console.log('Reached response ...')
        return callback(null, response);
      },

    ], ctrl.asyncCallback(deferred));

    return deferred.promise;
  };

  this.getTeamPlayers = function(request, response, app) {
    var data = request.data;
    var response = {};
    var currentUser = null;

    var deferred = q.defer();
    async.waterfall([
      // Data validation...
      function(callback) {
        var errors = validate(data, singleTeamIDRequestConstraints);
        if (errors) {
          return ctrl.errorCallback(callback, 1, "Invalid Parameters", errors);
        }
        return callback(null);
      },

      function(callback) {
        knex.union([
          TeamService.getTeamPlayers(data.TeamID),
          TeamService.getUnconfirmedTeamPlayers(data.TeamID),
        ], true)
          .then(function(teamPlayers) {
            if (typeof teamPlayers === 'undefined') {
              teamPlayers = [];
            }
            response.Players = teamPlayers;
            return callback(null);
          }, function(err) {
            return ctrl.errorCallback(callback, 1, "Cannot find team players.");
          });
      },

      // Returns the response..
      function(callback) {
        return callback(null, response);
      },

    ], ctrl.asyncCallback(deferred));
    return deferred.promise;

  }


  this.getUnconfirmedTeamPlayers = function(request, response, app) {
    var data = request.data;
    var response = {};
    var currentUser = null;

    var deferred = q.defer();
    async.waterfall([
      // Data validation...
      function(callback) {
        var errors = validate(data, singleTeamIDRequestConstraints);
        if (errors) {
          return ctrl.errorCallback(callback, 1, "Invalid Parameters", errors);
        }
        return callback(null);
      },

      function(callback) {
        TeamService.getUnconfirmedTeamPlayers(data.TeamID)
          .then(function(teamPlayers) {
            if (typeof teamPlayers === 'undefined') {
              teamPlayers = [];
            }
            response.Players = teamPlayers;
            return callback(null);
          }, function(err) {
            return ctrl.errorCallback(callback, 1, "Cannot find team players.");
          });
      },

      // Returns the response..
      function(callback) {
        return callback(null, response);
      },

    ], ctrl.asyncCallback(deferred));
    return deferred.promise;

  }


  this.updateTeam = function(request, response, app) {

    var data = request.data;
    var response = {};
    var currentUser = null;
    var updatedTeamInfo = {};

    var updateTeamRequestConstraints = {
      TeamID: {
        presence: {
          message: "is required"
        },
        numericality: {
          onlyInteger: true,
          greaterThan: 0
        }
      },
      TeamName: {

      }
    };

    var deferred = q.defer();
    async.waterfall([
      // Data validation...
      function(callback) {
        var errors = validate(data, updateTeamRequestConstraints);
        if (errors) {
          return ctrl.errorCallback(callback, 1, "Invalid Parameters", errors);
        }
        return callback(null);
      },

      function(callback) {

        TeamService
          .getTeam(data.TeamID, request.userID)
          .then(function(team) {

            if (typeof team === 'undefined') {
              return ctrl.errorCallback(callback, 1, "Team no longer exists!");
            }

            if (team.Manager != request.userID) {
              return ctrl.errorCallback(callback, 1, "You are not the manager of this team.");
            }

            return callback(null, team);

          }, function(err) {
            return ctrl.errorCallback(callback, 1, "A database error has occurred. Make sure your parameters are correctly.", err);
          });

      },

      // Update team profile picture
      function (team, callback) {

        if (typeof data.Picture === 'undefined') {
          return callback(null, team);
        }

        if (!data.Picture) {
          return callback(null, team);
        }

        var fs                  = require('fs');
        var img                 = data.Picture;
        var sanitizedImageData  = img.replace(/^data:image\/\w+;base64,/, "");
        var buf                 = new Buffer(sanitizedImageData, 'base64');
        var filename            = suid(32) + '.jpg';

        fs.writeFile('public/UserUploads/TeamPictures/' + filename, buf, function(err) {
          if(err) {
            return callback(err);
          }
          data.PictureURL = config.baseUrl + 'UserUploads/TeamPictures/' + filename;
          return callback(null, team);
        });

      },

      // Update team cover picture
      function (team, callback) {

        if (typeof data.CoverPicture === 'undefined') {
          return callback(null, team);
        }

        if (!data.CoverPicture) {
          return callback(null, team);
        }

        var fs                  = require('fs');
        var img                 = data.CoverPicture;
        var sanitizedImageData  = img.replace(/^data:image\/\w+;base64,/, "");
        var buf                 = new Buffer(sanitizedImageData, 'base64');
        var filename            = suid(32) + '.jpg';

        fs.writeFile('public/UserUploads/TeamPictures/' + filename, buf, function(err) {
          if(err) {
            return callback(err);
          }
          data.CoverPictureURL = config.baseUrl + 'UserUploads/TeamPictures/' + filename;
          return callback(null, team);
        });

      },

      // Returns the response..
      function(team, callback) {

        if (data.TeamName) {
          updatedTeamInfo.name = data.TeamName;
        }

        if (data.Lat) {
          updatedTeamInfo.lat = data.Lat;
        }

        if (data.Lon) {
          updatedTeamInfo.lon = data.Lon;
        }

        if (data.TeamSize) {
          updatedTeamInfo.team_size = data.TeamSize;
        }

        if (data.PictureURL) {
          updatedTeamInfo.picture = data.PictureURL;
        }

        if (data.CoverPictureURL) {
          updatedTeamInfo.cover_picture = data.CoverPictureURL;
        }

        if (data.Formation) {
          updatedTeamInfo.formation = data.Formation;
        }

        updatedTeamInfo.updated_at = moment().format("YYYY-MM-DD HH:mm:ss");

        knex('teams')
          .where('id', team.TeamID)
          .update(updatedTeamInfo)
          .then(function() {
            return callback(null);
          }, function(err) {
            return ctrl.errorCallback(callback, 1, "A database error has occurred while updating team.", err);
          });
      },

      // Get upcominggame ids
      function(callback) {
        var timeNow = (new Date()).getTime();
        knex('games').select()
          .where('team_id', data.TeamID)
          .where('game_time', '>', timeNow)
          .then(function(games) {
            callback(null, games);
          }, function(err) {
            console.log(err);
            return ctrl.errorCallback(callback, 1, "Unknown error", err);
          });
      },

      // Update game picture
      function(games, callback) {
        if (games.length === 0 || typeof games === 'undefined' || typeof updatedTeamInfo.picture === 'undefined') {
          return callback(null);
        }

        var gameIDs = games.map(function(game) {
          return game.id;
        });

        knex('games')
          .whereIn('id', gameIDs)
          .update({picture: updatedTeamInfo.picture})
          .then(function(results) {
            callback(null);
          }, function(err) {
            console.log(err);
            return ctrl.errorCallback(callback, 1, "Error while updating game picture", err);
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
          }, function(err) {
            console.log(err);
            return ctrl.errorCallback(callback, 1, "Unknown error", err);
          });
      },

      // Insert data to posts
      function(firstName, lastName, pictureURL, callback) {
        if (typeof data.PictureURL === 'undefined' && typeof data.CoverPictureURL === 'undefined') {
          return callback(null);
        }

        var teamData = {};
        var title = '';
        var content = null;
        var type = '';

        if (data.PictureURL) {
          teamData.PictureURL = data.PictureURL;
          content = data.PictureURL;
          title = 'updated profile picture';
          type = 'profile picture update';
        } else if (data.CoverPictureURL) {
          teamData.CoverPictureURL = data.CoverPictureURL;
          content = data.CoverPictureURL;
          title = 'updated cover picture';
          type = 'cover picture update';
        }

        teamData.TeamID = data.TeamID;

        return Promise.all([
          NewsfeedService.createSystemPost({
            'userID': request.userID, 
            'postTitle': title, 
            'postContent': content, 
            'postType': type,
            'postParentID': data.TeamID, 
            'postParentType': 'team', 
            'postMeta': teamData
          }),
        ]).then(function() {
          return callback(null);
        }, function(err) {
          console.log(err);
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

  this.changeTeamName = function(request, response, app) {
    var data = request.data;
    var response = {};
    var currentUser = null;


    var changeTeamNameRequestConstraints = {
      TeamID: {
        presence: {
          message: "is required"
        },
        numericality: {
          onlyInteger: true,
          greaterThan: 0
        }
      },
      TeamName: {
        presence: {
          message: "is required"
        }
      }
    };


    var deferred = q.defer();
    async.waterfall([
      // Data validation...
      function(callback) {
        var errors = validate(data, changeTeamNameRequestConstraints);
        if (errors) {
          return ctrl.errorCallback(callback, 1, "Invalid Parameters", errors);
        }
        return callback(null);
      },

      function(callback) {

        TeamService
          .getTeam(data.TeamID, request.userID)
          .then(function(team) {

            if (typeof team === 'undefined') {
              return ctrl.errorCallback(callback, 1, "Team no longer exists!");
            }

            if (team.Manager != request.userID) {
              return ctrl.errorCallback(callback, 1, "You are not the manager of this team.");
            }

            return callback(null, team);

          }, function(err) {
            return ctrl.errorCallback(callback, 1, "A database error has occurred. Make sure your parameters are correctly.", err);
          });

      },
      // Returns the response..
      function(team, callback) {
        knex('teams')
          .where('id', team.TeamID)
          .update({
            name: data.TeamName,
            updated_at: moment().format("YYYY-MM-DD HH:mm:ss")
          })
          .then(function() {
            return callback(null);
          }, function(err) {
            return ctrl.errorCallback(callback, 1, "A database error has occurred while updating team.", err);
          });
      },

      // Returns the response..
      function(callback) {
        return callback(null, response);
      },

    ], ctrl.asyncCallback(deferred));
    return deferred.promise;

  }

  this.changeTeamLocation = function(request, response, app) {
    var data = request.data;
    var response = {};
    var currentUser = null;

    var changeTeamLocationRequestConstraints = {
      TeamID: {
        presence: {
          message: "is required"
        },
        numericality: {
          onlyInteger: true,
          greaterThan: 0
        }
      },

      Lat: {
        presence: {
          message: "is required"
        }
      },

      Lon: {
        presence: {
          message: "is required"
        }
      }
    };


    var deferred = q.defer();
    async.waterfall([
      // Data validation...
      function(callback) {
        var errors = validate(data, changeTeamLocationRequestConstraints);
        if (errors) {
          return ctrl.errorCallback(callback, 1, "Invalid Parameters", errors);
        }
        return callback(null);
      },

      function(callback) {

        TeamService
          .getTeam(data.TeamID, request.userID)
          .then(function(team) {

            if (typeof team === 'undefined') {
              return ctrl.errorCallback(callback, 1, "Team no longer exists!");
            }

            if (team.Manager != request.userID) {
              return ctrl.errorCallback(callback, 1, "You are not the manager of this team.");
            }

            return callback(null, team);

          }, function(err) {
            return ctrl.errorCallback(callback, 1, "A database error has occurred. Make sure your parameters are correctly.", err);
          });

      },
      // Returns the response..
      function(team, callback) {
        knex('teams')
          .where('id', team.TeamID)
          .update({
            lat: data.Lat,
            lon: data.Lon,
            updated_at: moment().format("YYYY-MM-DD HH:mm:ss")
          })
          .then(function() {
            return callback(null);
          }, function(err) {
            return ctrl.errorCallback(callback, 1, "A database error has occurred while updating team.", err);
          });
      },

      // Returns the response..
      function(callback) {
        return callback(null, response);
      },

    ], ctrl.asyncCallback(deferred));
    return deferred.promise;

  }

  this.changeTeamPlayerPositions = function(request, response, app) {
    var data = request.data;
    var response = {};
    var currentUser = null;

    var requestConstraints = {
      TeamID: {
        presence: {
          message: "is required"
        },
        numericality: {
          onlyInteger: true,
          greaterThan: 0
        }
      },

      Positions: {
        presence: {
          message: "is required"
        }
      },

    };

    var TeamPositionsTransformerGenerator = function(teamPlayers) {
      return function(positionItem) {

        var finances =  teamPlayers.filter(function(player){
          return positionItem.UserID === player.UserID;
        });

        positionItem.Finances = finances.length > 0 ? finances[0].Finances : 0;

        return positionItem;
      };
    };


    var deferred = q.defer();
    async.waterfall([
      // Data validation...
      function(callback) {
        var errors = validate(data, requestConstraints);
        if (errors) {
          return ctrl.errorCallback(callback, 1, "Invalid Parameters", errors);
        }
        return callback(null);
      },

      function(callback) {

        TeamService
          .getTeam(data.TeamID, request.userID)
          .then(function(team) {

            if (typeof team === 'undefined') {
              return ctrl.errorCallback(callback, 1, "Team no longer exists!");
            }

            if (team.Manager != request.userID) {
              return ctrl.errorCallback(callback, 1, "You are not the manager of this team.");
            }

            return callback(null, team);

          }, function(err) {
            return ctrl.errorCallback(callback, 1, "A database error has occurred. Make sure your parameters are correctly.", err);
          });

      },
      // Returns the response..
      function(team, callback) {
        return callback(null, team);
      },

      function(team, callback) {
        knex.union([
          TeamService.getTeamPlayers(data.TeamID),
          TeamService.getUnconfirmedTeamPlayers(data.TeamID),
        ], true)
          .then(function(teamPlayers) {
            if (typeof teamPlayers === 'undefined') {
              teamPlayers = [];
            }
            return callback(null, team, teamPlayers);
          }, function(err) {
            return ctrl.errorCallback(callback, 1, "Cannot find team players.");
          });
      },

      function(team, teamPlayers, callback) {
        if (teamPlayers.length != data.Positions.length) {
          return ctrl.errorCallback(callback, 1, "Incorrect number of positions specified. " + data.Positions.length + " received instead of " + teamPlayers.length);
        }

        var userIDs = teamPlayers.map(function(player) {
          return player.UserID;
        });

        var confirmedUserIDs = teamPlayers.filter(function(player){
          return player.Confirmed;
        }).map(function(player) {
          return player.UserID;
        });

        var positions = data.Positions.map(function(item) {
          return item.PositionID;
        });

        for (var i = 0; i < data.Positions.length; i++) {
          data.Positions[i].Confirmed = 0;
          if (userIDs.indexOf(data.Positions[i].UserID) < 0) {
            return ctrl.errorCallback(callback, 1, "You need to specify the positions of the same players that are in the team. Don't miss any out.");
          }
          if (confirmedUserIDs.indexOf(data.Positions[i].UserID) >= 0) {
            data.Positions[i].Confirmed = 1;
          }
        }

        if ((data.Positions.length) != _.uniq(positions).length) {
          return ctrl.errorCallback(callback, 1, "Position used twice");
        }

        var invalidPositions = positions.filter(function(positionId) {
          return positionId < 0 || positionId > 100;
        });

        if (invalidPositions.length) {
          return ctrl.errorCallback(callback, 1, "Position OOB");
        }

        data.Positions = data.Positions.map(TeamPositionsTransformerGenerator(teamPlayers));

        TeamService.updateTeamPositions(data.TeamID, data.Positions)
          .then(function(result) {
            return callback(null);
          }, function(err) {
            return ctrl.errorCallback(callback, 1, "Cannot update team player positions.");
          });
      },

      // Update team "updated_at"
      function(callback) {
        knex('teams')
          .where('id', data.TeamID)
          .update({
            updated_at: moment().format("YYYY-MM-DD HH:mm:ss")
          })
          .then(function() {
            return callback(null);
          }, function(err) {
            return ctrl.errorCallback(callback, 1, "Team could not be updated while updating team positions.", err);
          });
      },

      // Returns the response..
      function(callback) {
        return callback(null, response);
      },

    ], ctrl.asyncCallback(deferred));
    return deferred.promise;

  }

  this.removeFromTeam = function(request, response, app) {
    var data = request.data;
    var response = {};
    var currentUser = null;

    var removeFromTeamRequestConstraints = {
      TeamID: {
        presence: {
          message: "is required"
        },
        numericality: {
          onlyInteger: true,
          greaterThan: 0
        }
      },

      UserID: {
        presence: {
          message: "is required"
        },
        numericality: {
          onlyInteger: true,
          greaterThan: 0
        }
      }
    };


    var deferred = q.defer();
    async.waterfall([
      // Data validation...
      function(callback) {
        var errors = validate(data, removeFromTeamRequestConstraints);
        if (errors) {
          return ctrl.errorCallback(callback, 1, "Invalid Parameters", errors);
        }
        return callback(null);
      },

      function(callback) {

        TeamService
          .getTeam(data.TeamID, request.userID)
          .then(function(team) {

            if (typeof team === 'undefined') {
              return ctrl.errorCallback(callback, 1, "Team no longer exists!");
            }

            if (team.Manager != request.userID) {
              return ctrl.errorCallback(callback, 1, "You are not the manager of this team.");
            }

            return callback(null, team);

          }, function(err) {
            return ctrl.errorCallback(callback, 1, "A database error has occurred. Make sure your parameters are correctly.", err);
          });

      },
      //  Remove from team_players
      function(team, callback) {
        knex('team_players')
          .where('team_id', team.TeamID)
          .where('user_id', data.UserID)
          .delete()
          .then(function() {
            return callback(null, team);
          }, function(err) {
            return ctrl.errorCallback(callback, 1, "A database error has occurred while removing a player from team players.", err);
          });
      },

      // Remove from team_invites
      function(team, callback) {
        knex('team_invites')
          .where('team_id', team.TeamID)
          .where('user_id', data.UserID)
          .delete()
          .then(function() {
            return callback(null);
          }, function(err) {
            return ctrl.errorCallback(callback, 1, "A database error has occurred while removing a player from team invites.", err);
          });
      },

      // Update team "updated_at"
      function(callback) {
        knex('teams')
          .where('id', data.TeamID)
          .update({
            updated_at: moment().format("YYYY-MM-DD HH:mm:ss")
          })
          .then(function() {
            return callback(null);
          }, function(err) {
            return ctrl.errorCallback(callback, 1, "Team could not be updated while removing team member.", err);
          });
      },

      // Returns the response..
      function(callback) {
        return callback(null, response);
      },

    ], ctrl.asyncCallback(deferred));
    return deferred.promise;

  }

  this.checkUserRightToLeaveTeam = function(request) {
    var data = request.data;
    var response = {};

    var chatUserID = null;

    var leaveTeamRequestConstraints = {
      TeamID: {
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
        var errors = validate(data, leaveTeamRequestConstraints);
        if (errors) {
          return ctrl.errorCallback(callback, 1, "Invalid Parameters", errors);
        }
        return callback(null);
      },

      // Check if team exists and teams is not deleted yet
      function(callback) {
        knex.select()
          .from('teams')
          .where('id', data.TeamID)
          .first()
          .then(function(team) {
            if (typeof team === 'undefined' || team.deleted_at) {
              return ctrl.errorCallback(callback, 2, "Team no longer exist");
            }

            if (team.manager_id === request.userID) {
              return ctrl.errorCallback(callback, 3, "Team manager could not leave the team!");
            }

            response.HasRight = 1;
            return callback(null);
          }, function(err) {
            return ctrl.errorCallback(callback, 4, "Error retrieving team", err);
          });

      },

      // Returns the response..
      function(callback) {
        return callback(null, response);
      },

    ], ctrl.asyncCallback(deferred));
    return deferred.promise;
  };

  this.leaveTeam = function(request, response, app) {
    var data = request.data;
    var response = {};
    var currentUser = null;

    var deferred = q.defer();
    async.waterfall([
      // Data validation...
      function(callback) {
        var errors = validate(data, singleTeamIDRequestConstraints);
        if (errors) {
          return ctrl.errorCallback(callback, 1, "Invalid Parameters", errors);
        }
        return callback(null);
      },

      function(callback) {

        TeamService
          .getTeam(data.TeamID, request.userID)
          .then(function(team) {

            if (typeof team === 'undefined') {
              return ctrl.errorCallback(callback, 1, "Team no longer exists!");
            }

            if (team.Manager === request.userID) {
              return ctrl.errorCallback(callback, 2, "Team manager could not leave the team!");
            }

            return callback(null, team);

          }, function(err) {
            return ctrl.errorCallback(callback, 1, "A database error has occurred. Make sure your parameters are correctly.", err);
          });

      },
      // Returns the response..
      function(team, callback) {
        knex('team_players')
          .where('team_id', team.TeamID)
          .where('user_id', request.userID)
          .delete()
          .then(function() {
            return callback(null, team);
          }, function(err) {
            return ctrl.errorCallback(callback, 1, "A database error has occurred while updating team.", err);
          });
      },

      // Remove player from team
      function(team, callback) {
        knex('team_invites')
          .where('team_id', team.TeamID)
          .where('user_id', request.userID)
          .delete()
          .then(function() {
            return callback(null);
          }, function(err) {
            console.log(err);
            return ctrl.errorCallback(callback, 1, "A database error has occurred while deleting player from team invites.", err);
          });
      },

      // Update team "updated_at"
      function(callback) {
        knex('teams')
          .where('id', data.TeamID)
          .update({
            updated_at: moment().format("YYYY-MM-DD HH:mm:ss")
          })
          .then(function() {
            return callback(null);
          }, function(err) {
            return ctrl.errorCallback(callback, 1, "A database error has occurred while updating team.", err);
          });
      },

      // Returns the response..
      function(callback) {
        return callback(null, response);
      },

    ], ctrl.asyncCallback(deferred));
    return deferred.promise;

  }

  this.getTeam = function(request, response, app) {
    var data = request.data;
    var response = {};
    var currentUser = null;
    var deferred = q.defer();
    async.waterfall([
      // Data validation...
      function(callback) {
        var errors = validate(data, singleTeamIDRequestConstraints);
        if (errors) {
          return ctrl.errorCallback(callback, 1, "Invalid Parameters", errors);
        }
        return callback(null);
      },

      function(callback) {

        TeamService
          .getTeam(data.TeamID, request.userID)
          .then(function(team) {

            if (typeof team === 'undefined') {
              return ctrl.errorCallback(callback, 1, "Team no longer exists!");
            }

            return callback(null, team);

          }, function(err) {
            console.log(err);
            return ctrl.errorCallback(callback, 1, "A database error has occurred. Make sure your parameters are correctly.", err);
          });

      },
      // Returns the response..
      function(team, callback) {
        knex.union([
          TeamService.getTeamPlayers(data.TeamID),
          TeamService.getUnconfirmedTeamPlayers(data.TeamID),
        ], true)
          .then(function(teamPlayers) {
            if (typeof teamPlayers === 'undefined') {
              teamPlayers = [];
            }
            team.Players = teamPlayers;
            return callback(null, team);
          }, function(err) {
            return ctrl.errorCallback(callback, 1, "Cannot find team players.");
          });
      },

      // Returns the response..
      function(team, callback) {

        if(team.PictureURL) {
          team.PictureURL = urlFixer(team.PictureURL);
        }

        if(team.CoverPictureURL) {
          team.CoverPictureURL = urlFixer(team.CoverPictureURL);
        }

        response.Team = team;
        return callback(null);
      },

      // Returns the response..
      function(callback) {
        return callback(null, response);
      },

    ], ctrl.asyncCallback(deferred));
    return deferred.promise;

  }

  this.respondToTeamInvite = function(request, response, app) {
    var data = request.data;
    var response = {};
    var currentUser = null;
    var teamChatDialogID = null;
    var chatUserID = null;

    var respondToTeamInviteRequestConstraints = {
      TeamID: {
        presence: {
          message: "is required"
        },
        numericality: {
          onlyInteger: true,
          greaterThan: 0
        }
      },
      Response: {
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
        var errors = validate(data, respondToTeamInviteRequestConstraints);
        if (errors) {
          return ctrl.errorCallback(callback, 1, "Invalid Parameters", errors);
        }
        return callback(null);
      },

      // Gets the current user.
      function(callback) {
        knex.select([
          'user.id as UserID',
          'reg_info.name as FirstName',
          'reg_info.last_name as LastName',
          'reg_info.picture as PictureURL',
        ])
          .from('user')
          .innerJoin('reg_info', 'reg_info.user_id', 'user.id')
          .where('user.id', request.userID)
          .first()
          .then(function(user) {
            if (typeof user === 'undefined') {
              return ctrl.errorCallback(callback, 1, "Cannot find current user details.");
            }
            currentUser = user;
            return callback(null);
          }, function(err) {
            console.log(err);
            return ctrl.errorCallback(callback, 1, "A database error has occurred. Make sure your parameters are correctly.", err);
          });
      },

      function(callback) {

        TeamService
          .getTeam(data.TeamID, request.userID)
          .then(function(team) {

            if (typeof team === 'undefined') {
              return ctrl.errorCallback(callback, 1, "Team no longer exists!");
            }

            return callback(null, team);

          }, function(err) {
            console.log(err);
            return ctrl.errorCallback(callback, 1, "A database error has occurred. Make sure your parameters are correctly.", err);
          });

      },
      // Returns the response..
      function(team, callback) {
        TeamService.getTeamInvite(data.TeamID, request.userID)
          .then(function(teamInvite) {
            if (typeof teamInvite === 'undefined') {
              return ctrl.errorCallback(callback, 1, "Cannot find team invite.");
            }

            return callback(null, team, teamInvite);
          }, function(err) {
            console.log(err);
            return ctrl.errorCallback(callback, 1, "Error finding team invite.");
          });
      },

      // Returns the response..
      function(team, teamInvite, callback) {

        TeamService.deleteTeamInvite(data.TeamID, request.userID)
          .then(function() {
            return callback(null, team, teamInvite);
          }, function(err) {
            console.log(err);
            return ctrl.errorCallback(callback, 1, "Error deleting team invite.");
          });

      },

      // Returns the response..
      function(team, teamInvite, callback) {

        if (!data.Response) {
          return callback(null, team, teamInvite);
        }

        // Delete the player with same position ???
        knex('team_players')
          .where('team_players.team_id', data.TeamID)
          .andWhere('team_players.position', teamInvite.Position)
          .andWhere('team_players.position', '>=', 0)
          .del()
          .then(function() {
            return callback(null, team, teamInvite);
          }, function(err) {
            console.log(err);
            return ctrl.errorCallback(callback, 1, "Error deleting team players.");
          });



      },

      // Returns the response..
      function(team, teamInvite, callback) {

        if (!data.Response) {
          return callback(null, team, teamInvite);
        }

        knex('team_players')
          .insert({
            team_id: data.TeamID,
            user_id: request.userID,
            position: teamInvite.Position
          })
          .then(function(teamIDs) {
            return callback(null, team, teamInvite);
          }, function(err) {
            console.log(err);
            return ctrl.errorCallback(callback, 1, "Error inserting team player.");
          });

      },


      // Find team training ID if any
      function(team, teamInvite, callback) {
        knex('team_training').select(['id', 'team_id'])
          .where('team_id', data.TeamID)
          .then(function(results) {
            if (results.length == 0) {
              return callback(null, team, teamInvite, undefined);
            }
            return callback(null, team, teamInvite, results[0].id)
          })
          .catch(function(err) {
            console.log(err);
            return ctrl.errorCallback(callback, 1, "Unknown error");
          });
      },

      // Add player to team training
      function(team, teamInvite, trainingID, callback) {
        if (typeof trainingID === 'undefined') {
          return callback(null, team, teamInvite);
        }
        knex('team_training_responses').insert({
          training_id: trainingID,
          user_id: request.userID,
        })
          .then(function() {
            return callback(null, team, teamInvite);
          })
          .catch(function(err) {
            console.log(err);
            return ctrl.errorCallback(callback, 1, "Unknown error");
          });
      },

      // Get team chat dialog id if current player accepts the team invite
      function(team, teamInvite, callback) {
        if (data.Response !== 1) {
          return callback(null, team, teamInvite);
        }

        knex.select(['chat_dialog_id'])
          .from('teams')
          .where('id', team.TeamID)
          .first()
          .then(function(teamChatSession) {
            if (typeof teamChatSession === 'undefined') {
              return callback(null, team, teamInvite);
            }

            teamChatDialogID = teamChatSession.chat_dialog_id;
            return callback(null, team, teamInvite);
          }, function(err) {
            console.log(err);
            return ctrl.errorCallback(callback, 1, "Error finding team chat id", err);
          });
      },

      // Get user chat id
      function(team, teamInvite, callback) {
        if (data.Response !== 1 || !teamChatDialogID) {
          return callback(null, team, teamInvite);
        }

        knex.select(['user_chat_sessions.chat_user_id'])
          .from('user_chat_sessions')
          .where('user_id', request.userID)
          .first()
          .then(function(userChatSession) {
            if (typeof userChatSession === 'undefined') {
              return ctrl.errorCallback(callback, 1, "User chat id not found");
            }

            chatUserID = userChatSession.chat_user_id;
            return callback(null, team, teamInvite);
          }, function(err) {
            console.log(err);
            return ctrl.errorCallback(callback, 1, "Error finding chat user id", err);
          });

      },

      // Add player to team chat group if current player accepts the team invite
      function(team, teamInvite, callback) {
        if (data.Response !== 1 || !teamChatDialogID || !chatUserID) {
          return callback(null, team, teamInvite);
        }

        var params = {
          push_all: {occupants_ids: [chatUserID]},
          name: team.TeamName + "'s Group Chat",
          data: {
            class_name: "TeamDialog",
            team_id: team.TeamID
          },
        };

        ChatService.getChatSession(team.Manager).then(function(result) {
          var teamManagerQB = result.QB;

          teamManagerQB.chat.dialog.update(teamChatDialogID, params, function(err, results) {
            if (err) {
              console.log(err);
              return callback(err);
            }

            return callback(null, team, teamInvite);
          });

        }, function(error) {
          console.log(err);
          console.log("Could not retreive team manager's chat session...");
          return callback(error);
        });
      },

      // Returns the response..
      function(team, teamInvite, callback) {

        var userIDs = [team.Manager];
        var notification = {
          type: 60,
          timestamp: (new Date()).getTime(),
          data: {
            'UserID': currentUser.UserID,
            'TeamID': team.TeamID,
            'Response': data.Response,
            'FirstName': currentUser.FirstName,
            'LastName': currentUser.LastName,
            'PictureURL': currentUser.PictureURL,
          },
        };

        var message = currentUser.FirstName + " " + currentUser.LastName 
          + " has " + ((data.Response==1)?"accepted":"rejected")
          + " your team invite.";

        Promise.all([
          NotificationService.sendNotifications(userIDs, notification, message, app),
        ])
          .then(function(values) {
            return callback(null, team, teamInvite);
          }, function(err) {
            console.log(err);
            return ctrl.errorCallback(callback, 1, "A database error has occurred. Make sure your parameters are correctly.", err);
          });

      },

      // Returns the response..
      function(team, teamInvite, callback) {
        return callback(null, response);
      },

    ], ctrl.asyncCallback(deferred));

    return deferred.promise;

  }



this.getTeamFinances = function(request, response, app) {
  var data = request.data;
  var response = {};
  var currentUser = null;
  var deferred = q.defer();
  async.waterfall([
    // Data validation...
    function(callback) {
      var errors = validate(data, singleTeamIDRequestConstraints);
      if (errors) {
        return ctrl.errorCallback(callback, 1, "Invalid Parameters", errors);
      }
      return callback(null);
    },

    function(callback) {

      TeamService
        .getTeam(data.TeamID, request.userID)
        .then(function(team) {

          if (typeof team === 'undefined') {
            return ctrl.errorCallback(callback, 1, "Team no longer exists!");
          }

          return callback(null, team);

        }, function(err) {
          return ctrl.errorCallback(callback, 1, "A database error has occurred. Make sure your parameters are correctly.", err);
        });

    },
    // Returns the response..
    function(team, callback) {
      knex.union([
        TeamService.getTeamPlayers(data.TeamID),
        TeamService.getUnconfirmedTeamPlayers(data.TeamID),
      ], true)
        .then(function(teamPlayers) {
          if (typeof teamPlayers === 'undefined') {
            teamPlayers = [];
          }
          team.Players = teamPlayers;
          return callback(null, team);
        }, function(err) {
          return ctrl.errorCallback(callback, 1, "Cannot find team players.");
        });
    },

    // Returns the response..
    function(team, callback) {
      response.Team = team;
      return callback(null);
    },

    // Returns the response..
    function(callback) {
      return callback(null, response);
    },

  ], ctrl.asyncCallback(deferred));
  return deferred.promise;

}

this.followTeam = function(request, response, app) {
  var data = request.data;
  var response = {};
  var currentUser = null;
  var deferred = q.defer();
  async.waterfall([
    // Data validation...
    function(callback) {
      var errors = validate(data, singleTeamIDRequestConstraints);
      if (errors) {
        return ctrl.errorCallback(callback, 1, "Invalid Parameters", errors);
      }
      return callback(null);
    },

    function(callback) {

      TeamService
        .getTeam(data.TeamID, request.userID)
        .then(function(team) {

          if (typeof team === 'undefined') {
            return ctrl.errorCallback(callback, 1, "Team no longer exists!");
          }

          return callback(null, team);

        }, function(err) {
          return ctrl.errorCallback(callback, 1, "A database error has occurred. Make sure your parameters are correctly.", err);
        });

    },

    // Check if already followed
    function(team, callback) {
      knex
        .select()
        .from('team_followers')
        .where('team_followers.team_id', data.TeamID)
        .andWhere('team_followers.follower_id', request.userID)
        .first()
        .then(function(response) {

          if(typeof response === 'undefined') {
            return callback(null, false);  
          }

          return callback(null, true);  

        }, function(err) {
          return ctrl.errorCallback(callback, 1, "Could not retrieve follow status.");
        });
    },

    // Add follower...
    function(alreadyFollowed, callback) {

      if(alreadyFollowed) {
        return callback(null);  
      }

      knex('team_followers')
        .insert({
          team_id: data.TeamID,
          follower_id: request.userID,
          created_at: moment().format("YYYY-MM-DD HH:mm:ss")
        })
        .then(function(teamIDs) {
          return callback(null);
        }, function(err) {
          return ctrl.errorCallback(callback, 1, "Error following team.");
        });

    },


    // Returns the response..
    function(callback) {
      return callback(null, response);
    },

  ], ctrl.asyncCallback(deferred));
  return deferred.promise;

}


this.unfollowTeam = function(request, response, app) {
  var data = request.data;
  var response = {};
  var currentUser = null;
  var deferred = q.defer();
  async.waterfall([
    // Data validation...
    function(callback) {
      var errors = validate(data, singleTeamIDRequestConstraints);
      if (errors) {
        return ctrl.errorCallback(callback, 1, "Invalid Parameters", errors);
      }
      return callback(null);
    },

    function(callback) {

      TeamService
        .getTeam(data.TeamID, request.userID)
        .then(function(team) {

          if (typeof team === 'undefined') {
            return ctrl.errorCallback(callback, 1, "Team no longer exists!");
          }

          return callback(null);

        }, function(err) {
          return ctrl.errorCallback(callback, 1, "A database error has occurred. Make sure your parameters are correctly.", err);
        });

    },

    // delete follower...
    function(callback) {

      knex('team_followers')
        .where('team_followers.team_id', data.TeamID)
        .andWhere('team_followers.follower_id', request.userID)
        .whereRaw('created_at < DATE_SUB(NOW(), INTERVAL 1 HOUR)')
        .delete()
        .then(function(teamIDs) {
          return callback(null);
        }, function(err) {
          return ctrl.errorCallback(callback, 1, "Error unfollowing team.");
        });

    },


    // Returns the response..
    function(callback) {
      return callback(null, response);
    },

  ], ctrl.asyncCallback(deferred));
  return deferred.promise;

}

this.getFollowers = function(request, response, app) {
  var data = request.data;
  var response = {};
  var currentUser = null;
  var deferred = q.defer();

  async.waterfall([
    // Data validation...
    function(callback) {
      var errors = validate(data, singleTeamIDRequestConstraints);
      if (errors) {
        return ctrl.errorCallback(callback, 1, "Invalid Parameters", errors);
      }
      return callback(null);
    },

    function(callback) {

      TeamService
        .getTeam(data.TeamID, request.userID)
        .then(function(team) {

          if (typeof team === 'undefined') {
            return ctrl.errorCallback(callback, 1, "Team no longer exists!");
          }

          return callback(null);

        }, function(err) {
          return ctrl.errorCallback(callback, 1, "A database error has occurred. Make sure your parameters are correctly.", err);
        });

    },

    // Check if already followed
    function(callback) {

      response.Followers = [];

      knex
        .select([
          'user.id as UserID',
          'reg_info.name as FirstName',
          'reg_info.last_name as LastName',
          'reg_info.picture as PictureURL',
          'team_followers.created_at as CreatedAt',
        ])
        .from('team_followers')
        .innerJoin('user', 'user.id', 'team_followers.follower_id')
        .innerJoin('reg_info', 'user.id', 'reg_info.user_id')
        .where('team_followers.team_id', data.TeamID)
        .then(function(followers) {

          if(typeof followers === 'undefined') {
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

}

this.searchTeamByName = function(request) {
  var data = request.data;
  var response = {};
  var deferred = q.defer();

  var searchTeamByNameRequestConstraints = {
    Name: {
      presence: {
        message: "is required"
      },
    },
    TeamID: {
      presence: {
        message: "is required"
      },
      numericality: {
        onlyInteger: true
      }
    }
  };

  async.waterfall([
    // Data validation...
    function(callback) {
      var errors = validate(data, searchTeamByNameRequestConstraints);
      if (errors) {
        return ctrl.errorCallback(callback, 1, "Invalid Parameters", errors);
      }
      return callback(null);
    },

    // Get the teams
    function(callback) {
      response.Results = [];
      var searchTerm = '%' + data.Name + '%';
      knex.select([
        'teams.id as team_id',
        'teams.name as team_name',
        'teams.picture as team_picture',
        'teams.lat as latitude',
        'teams.lon as longitude',
      ])
        .from('teams')
        .where(function() {
          this.where('teams.name', 'like', searchTerm)
            .andWhere('teams.id', '<>', data.TeamID);
        })
        .whereNull('deleted_at')
        .then(function(results) {
          for(var i = 0; i < results.length; i++) {
            response.Results.push({
              TeamID: results[i].team_id,
              Name: results[i].team_name,
              PictureURL: results[i].team_picture,
              Latitude: results[i].latitude,
              Longitude: results[i].longitude,
              Locality: null,
              Country: null
            });
          }

          return callback(null);
        }, function(err) {
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

this.getLastUpdatedTeam = function(request, response, app) {
  var data = request.data;
  var response = {};
  var currentUser = null;
  var deferred = q.defer();

  async.waterfall([
    function(callback) {

      TeamService
        .getLastUpdatedTeam(request.userID)
        .then(function(team) {
          return callback(null, team);
        }, function(err) {
          return ctrl.errorCallback(callback, 1, "A database error has occurred. Make sure your parameters are correctly.", err);
        });

    },

    // Returns the response..
    function(team, callback) {

      if (typeof team === "undefined") {
        return callback(null, team);
      }

      var teamID = team.TeamID;

      knex.union([
        TeamService.getTeamPlayers(teamID),
        TeamService.getUnconfirmedTeamPlayers(teamID),
      ], true)
        .then(function(teamPlayers) {

          if (typeof teamPlayers === 'undefined') {
            teamPlayers = [];
          }

          team.Players = teamPlayers;

          return callback(null, team);
        }, function(err) {
          return ctrl.errorCallback(callback, 1, "Cannot find team players.", err);
        });
    },

    // Get next game
    function(team, callback) {
      if (typeof team === "undefined") {
        return callback(null, team);
      }

      var teamID = team.TeamID;
      var timeNow = Date.now();
      knex('games')
        .select([
          'id AS GameID',
          'owner_id AS OwnerID',
          'venue AS Venue',
          'team_id AS TeamID',
          'game_time AS GameTime',
          'game_type AS GameType',
        ])
        .whereRaw('team_id = ? AND game_type <> \'Training\' AND game_time >= ?', [teamID, timeNow])
        .orderBy('game_time', 'asc')
        .limit(1)
        .then(function(results) {
          team.NextGame = results;
          return callback(null, team);
        }, function(err) {
          return ctrl.errorCallback(callback, 1, "Cannot find team players.", err);
        });
    },

    // Get next game players available
    function(team, callback) {
      if (typeof team === 'undefined') {
        return callback(null, team);
      }

      if (typeof team.NextGame === 'undefined') {
        return callback(null, team);
      }

      if (!team.NextGame.length) {
        return callback(null, team);
      }

      var teamID = team.TeamID;
      knex('game_invites')
        .select([
          'game_invites.user_id AS UserID',
          'game_invites.status AS STATUS',
          knex.raw('CONCAT(reg_info.name, \' \', reg_info.last_name) AS UserFullName'),
          'reg_info.picture AS PictureURL',
        ])
        .innerJoin('reg_info', 'game_invites.user_id', 'reg_info.user_id')
        .where('game_id', team.NextGame[0].GameID)
        .where('status', 'available')
        .then(function(gameInvites) {
          team.NextGame[0].AvailablePlayers = gameInvites;
          return callback(null, team);
        }, function(err) {
          return ctrl.errorCallback(callback, 1, "Cannot find game players.", err);
        });
    },

    // Returns the response..
    function(team, callback) {
      response.Team = team;
      return callback(null);
    },

    // Returns the response..
    function(callback) {
      return callback(null, response);
    },

  ], ctrl.asyncCallback(deferred));
  return deferred.promise;

}

this.deleteTeam = function(request) {
  var data = request.data;
  var response = {};

  var chatUserID = null;

  var deleteTeamRequestConstraints = {
    TeamID: {
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
      var errors = validate(data, deleteTeamRequestConstraints);
      if (errors) {
        return ctrl.errorCallback(callback, 1, "Invalid Parameters", errors);
      }
      return callback(null);
    },

    // Check if team exists and teams is not deleted yet
    function(callback) {
      knex.select()
        .from('teams')
        .where('id', data.TeamID)
        .first()
        .then(function(team) {
          if (typeof team === 'undefined' || team.deleted_at) {
            return ctrl.errorCallback(callback, 2, "Team no longer exist");
          }

          if (team.manager_id !== request.userID) {
            return ctrl.errorCallback(callback, 3, "You do not have the right to delete this team");
          }

          return callback(null);
        }, function(err) {
          return ctrl.errorCallback(callback, 4, "Error retrieving team", err);
        });

    },

    // Delete the team
    function(callback) {
      knex('teams')
        .where('id', data.TeamID)
        .update({'deleted_at': moment().format("YYYY-MM-DD HH:mm:ss")})
        .then(function(result) {
          return callback(null);
        }, function(err) {
          log.error(err);
          return ctrl.errorCallback(callback, 5, "Team could not be deleted.");
        });
    },

    // Returns the response..
    function(callback) {
      return callback(null, response);
    },

  ], ctrl.asyncCallback(deferred));
  return deferred.promise;
};  

this.checkUserRightToDeleteTeam = function(request) {
  var data = request.data;
  var response = {};

  var chatUserID = null;

  var deleteTeamRequestConstraints = {
    TeamID: {
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
      var errors = validate(data, deleteTeamRequestConstraints);
      if (errors) {
        return ctrl.errorCallback(callback, 1, "Invalid Parameters", errors);
      }
      return callback(null);
    },

    // Check if team exists and teams is not deleted yet
    function(callback) {
      knex.select()
        .from('teams')
        .where('id', data.TeamID)
        .first()
        .then(function(team) {
          if (typeof team === 'undefined' || team.deleted_at) {
            return ctrl.errorCallback(callback, 2, "Team no longer exist");
          }

          if (team.manager_id !== request.userID) {
            return ctrl.errorCallback(callback, 3, "You do not have the right to delete this team");
          }

          response.HasRight = 1;
          return callback(null);
        }, function(err) {
          return ctrl.errorCallback(callback, 4, "Error retrieving team", err);
        });

    },

    // Returns the response..
    function(callback) {
      return callback(null, response);
    },

  ], ctrl.asyncCallback(deferred));
  return deferred.promise;
};

this.getDeletedTeams = function(request) {
  var data = request.data;
  var response = {};

  var deferred = q.defer();
  async.waterfall([
    // Check if team exists and teams is not deleted yet
    function(callback) {
      knex.select()
        .from('teams')
        .whereNotNull ('deleted_at')
        .then(function(teams) {
          response.Teams = teams;
          return callback(null);
        }, function(err) {
          return ctrl.errorCallback(callback, 4, "Error retrieving team", err);
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

module.exports = new TeamController();
