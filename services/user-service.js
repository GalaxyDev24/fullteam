"use strict";

/* jshint esversion: 6 */

var knex = require('lib/knex');
class UserService {
    static getUserLocation(userID) {
      return knex.select([
        'lat',
        'lon',
        'locality',
        'country',
      ])
        .from('user_location')
        .where('user_id', userID)
        .first();
    }

    static getUserAverageRating(userID) {
      return knex.select([
          knex.raw("IFNULL(AVG(average), -1) as rating"),
        ])
        .from('user_feedback')
        .where('profile_user_id', userID)
        .first()
    }

    static getUsersBetterRatedByDistance(rating, distance, userLocation){
      return knex.select([
          knex.raw("*"),
        ])
        .from('user')
        .joinRaw('LEFT JOIN (SELECT user_id, searchable FROM user_settings) us ON us.user_id = user.id')
        .joinRaw('LEFT JOIN (SELECT lat, lon, GETDISTANCE(lat, lon, ?, ?) AS distance, user_id FROM user_location) ul ON ul.user_id = user.id ', [userLocation.lat, userLocation.lon])
        .joinRaw('LEFT JOIN (SELECT AVG(average) as rating, profile_user_id FROM user_feedback GROUP BY profile_user_id) uf ON uf.profile_user_id = user.id ')
        .where('ul.distance', '<', distance)
        .where('uf.rating', '>=', rating)
        .orderBy('uf.rating', 'DESC')
        .debug()
    }

    static getUserNumberByDistance(distance, userLocation) {
      return knex.select([
          knex.raw("count(user.id) as num_users"),
        ])
        .from('user')
        .joinRaw('LEFT JOIN (SELECT user_id, searchable FROM user_settings) us ON us.user_id = user.id  ')
        .joinRaw('LEFT JOIN (SELECT lat, lon, GETDISTANCE(lat, lon, ?, ?) AS distance, user_id FROM user_location) ul ON ul.user_id = user.id ', [userLocation.lat, userLocation.lon])
        .joinRaw('LEFT JOIN reg_info ri ON ri.user_id = user.id ')
        .where('us.searchable', 1)
        .where('ul.distance', '<', distance)
        .first()
    }

    static getTopTenByDistance(userID, distance, userLocation, followedByCurrentUser) { 
      return knex.select([
          'user.id',
          knex.raw("reg_info.name as FirstName"),
          knex.raw("reg_info.last_name as LastName"),
          knex.raw("reg_info.picture as PictureURL"),
          knex.raw("uf.rating as Rating"),
          knex.raw("ucs.chat_user_id as ChatUserID"),
          followedByCurrentUser
        ])
          .from('user')
          .joinRaw('INNER JOIN user_chat_sessions ucs ON ucs.user_id = user.id')
          .joinRaw('LEFT JOIN (SELECT user_id, searchable FROM user_settings) us ON us.user_id = user.id  ')
          .joinRaw('LEFT JOIN (SELECT lat, lon, GETDISTANCE(lat, lon, ?, ?) AS distance, user_id FROM user_location) ul ON ul.user_id = user.id ', [userLocation.lat, userLocation.lon])
          .joinRaw('LEFT JOIN (SELECT AVG(average) as rating, profile_user_id FROM user_feedback GROUP BY profile_user_id) uf ON uf.profile_user_id = user.id ')
          .joinRaw('LEFT JOIN reg_info ON reg_info.user_id = user.id ')
          .whereNotNull('uf.rating')
          .where('us.searchable', 1)
          .where('ul.distance', '<', distance)
          .orderBy('uf.rating', 'desc')
          .limit(10)
    }
}

module.exports = UserService;