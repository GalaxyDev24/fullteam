"use strict";

/* jshint esversion: 6 */

var knex = require('lib/knex');
var q = require('q');
var async = require('async');
var validate = require("validate.js");

class TeamService {

  static getTeam(teamID, userID) {

    var alreadyRatedColumn;

    if (typeof userID !== 'undefined') {
      alreadyRatedColumn = knex.raw('SELECT 1 FROM team_feedback WHERE team_id = ? AND from_user_id = ?', [teamID, userID])
        .wrap('IFNULL((', '), 0) as AlreadyRated');
    } else {
      alreadyRatedColumn = knex.raw('0 as AlreadyRated');
    }


    var followedByCurrentUser = 
      knex.raw('SELECT 1 FROM team_followers WHERE team_id = teams.id AND follower_id = ?', [userID])
        .wrap('IFNULL((', '), 0) as FollowedByCurrentUser');

    var avgFeedbackSubQuery = " SELECT " 
                            + "    tf.team_id AS team_id, " 
                            + "    AVG(tf.average) AS rating, " 
                            + "    AVG(tf.sportsmanship) AS sportsmanship, " 
                            + "    AVG(tf.teamwork) AS teamwork, " 
                            + "    AVG(tf.fitness) AS fitness, " 
                            + "    AVG(tf.reliability) AS reliability " 
                            + " FROM team_feedback tf " 
                            + " WHERE tf.team_id = ? ";

    return knex.select([
        'teams.id as TeamID',
        'teams.name as TeamName',
        'teams.manager_id as Manager',
        'teams.formation as Formation',
        'teams.team_size as TeamSize',
        'teams.lat as Lat',
        'teams.lon as Lon',
        'teams.picture as PictureURL',
        'teams.cover_picture as CoverPictureURL',
        'teams.chat_dialog_id as ChatDialogID',
        'user_chat_sessions.chat_user_id as ChatUserID',
        'reg_info.picture as ManagerPictureURL',
        knex.raw('CONCAT(reg_info.name, " ", reg_info.last_name) AS ManagerFullName'),
        knex.raw('IFNULL(avgfeedback.rating,0) AS AverageRating'),
        knex.raw('IFNULL(avgfeedback.sportsmanship,0) AS SportsmanshipRating'),
        knex.raw('IFNULL(avgfeedback.teamwork,0) AS TeamworkRating'),
        knex.raw('IFNULL(avgfeedback.reliability,0) AS ReliabilityRating'),
        knex.raw('IFNULL(avgfeedback.fitness,0) AS FitnessRating'),      
        alreadyRatedColumn,
        followedByCurrentUser
      ])
      .from('teams')
      .leftJoin('reg_info', 'teams.manager_id', 'reg_info.user_id')
      .leftJoin('user_chat_sessions', 'reg_info.user_id', 'user_chat_sessions.user_id')
      .joinRaw('LEFT JOIN (' + avgFeedbackSubQuery + ') avgfeedback ON avgfeedback.team_id = teams.id', teamID)
      .where('teams.id', teamID)
      .whereNull('teams.deleted_at')
      .first();
  }

  static getTeamPlayers(teamID) {

    return knex.select([
        'team_players.user_id as UserID',
        'team_players.team_id as TeamID',
        'team_players.position as PositionID',
        'team_players.finances as Finances',
        'reg_info.picture as PictureURL',
        'reg_info.name as FirstName',
        'reg_info.last_name as LastName',
        knex.raw('1 as Confirmed')
      ])
      .from('team_players')
      .innerJoin('teams', 'team_players.team_id', 'teams.id')
      .leftJoin('reg_info', 'team_players.user_id', 'reg_info.user_id')
      .where('team_players.team_id', teamID)
      .whereNull('teams.deleted_at');
  }

  static getUnconfirmedTeamPlayers(teamID) {

    return knex.select([
        'team_invites.user_id as UserID',
        'team_invites.team_id as TeamID',
        'team_invites.position as PositionID',
        knex.raw(' 0 as Finances'),
        'reg_info.picture as PictureURL',
        'reg_info.name as FirstName',
        'reg_info.last_name as LastName',
        knex.raw('0 as Confirmed')
      ])
      .from('team_invites')
      .innerJoin('teams', 'team_invites.team_id', 'teams.id')
      .leftJoin('reg_info', 'team_invites.user_id', 'reg_info.user_id')
      .where('team_invites.team_id', teamID)
      .whereNull('teams.deleted_at');
  }

  static getTeamInvite(teamID, userID) {

    return knex.select([
        'team_invites.user_id as UserID',
        'team_invites.team_id as TeamID',
        'team_invites.position as Position'
      ])
      .from('team_invites')
      .innerJoin('teams', 'team_invites.team_id', 'teams.id')
      .where('team_invites.team_id', teamID)
      .andWhere('team_invites.user_id', userID)
      .whereNull('teams.deleted_at')
      .first();
  }

  static deleteTeamInvite(teamID, userID) {

    return knex('team_invites')
      .where('team_invites.team_id', teamID)
      .andWhere('team_invites.user_id', userID)
      .del();
  }

  static getLastUpdatedTeam(userID) {

    return knex.select([
        'teams.id as TeamID',
        'teams.formation as Formation',
        'teams.picture as PictureURL',
        'teams.cover_picture as CoverPictureURL',
        'teams.name as Name',
        'teams.manager_id as ManagerID',
        'teams.team_size as TeamSize',
        'teams.lat as Lat',
        'teams.lon as Lon',
        'teams.created_at as CreatedAt',
        'teams.updated_at as UpdatedAt'
      ])
      .from('teams')
      .where('teams.manager_id', userID)
      .whereNull('teams.deleted_at')
      .orderBy('updated_at', 'DESC')
      .first();
  }

  static updateTeamPositions(teamID, positions) {

    var deferred = q.defer();

    async.waterfall([
      function(callback) {
        return knex('team_players')
          .where('team_players.team_id', teamID)
          .del()
          .then(function() {
            callback(null);
          }, function(err) {
            callback(err);
          });
      },

      function(callback) {
        return knex('team_invites')
          .where('team_invites.team_id', teamID)
          .del()
          .then(function() {
            callback(null);
          }, function(err) {
            callback(err);
          });
      },

      function(callback) {


        var rows = positions.filter(function(position) {
          return position.Confirmed;
        }).map(function(position) {
          return {
            team_id: teamID,
            user_id: position.UserID,
            position: position.PositionID,
            finances: position.Finances
          };
        });

        return knex.batchInsert('team_players', rows)
          .returning('id')
          .then(function() {
            callback(null);
          }, function(err) {
            callback(err);
          });
      },

      function(callback) {

        var rows = positions.filter(function(position) {
          return !position.Confirmed;
        }).map(function(position) {
          return {
            team_id: teamID,
            user_id: position.UserID,
            position: position.PositionID,
          };
        });

        return knex.batchInsert('team_invites', rows)
          .returning('id')
          .then(function() {
            callback(null);
          }, function(err) {
            callback(err);
          });
      },

    ], function(err, result) {

      if (err) {
        deferred.reject(err);
        return;
      }

      deferred.resolve(result);

    });

    return deferred.promise;
  }

  static validateInvitationUserIDs(value, options, key, attributes) {

    if (!validate.isArray(value)) {
      return 'is not an array';
    }

    for (var i = 0; i < value.length; i++) {
      if (!validate.isObject(value[i])) {
        return 'contains an item which is not an object';
      }

      if (!validate.contains(value[i], 'UserID')) {
        return 'contains an item without UserID';
      }

      if (!validate.contains(value[i], 'PositionID')) {
        return 'contains an item without PositionID';
      }

      if (value[i].PositionID < 0) {
        return 'contains an item with invalid PositionID';
      }

    }

    return null;

  }
}

module.exports = TeamService;