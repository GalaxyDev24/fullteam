var knex = require('lib/knex'),
  log = require('helpers/logger');
  q = require('q'),
  async = require('async'),
  moment = require('moment'),
  firebase = require('helpers/firebase');

var notificationTypes = {
  CHAT_MESSAGE: 0,
  GAME_APPLICATION: 10,
  GAME_APPLICATION_RESPONSE: 20,
  GAME_INVITE: 30,
  TEAM_GAME_INVITE: 30,
  GAME_INVITE_RESPONSE: 40,
  TEAMSHEET_INVITE: 50,
  TEAMSHEET_INVITE_RESPONSE: 60,
  LEFT_GAME: 70,
  RECEIVED_RATING: 80,
  NEW_FOLLOWER: 90,
  TEAM_CREATED: 100,
  UPDATED_USER_PICTURE: 110,
  UPDATED_TEAM_PICTURE: 120,
  POST_ON_USER_WALL: 130,
  POST_ON_TEAM_WALL: 140,
  COMMENT_ON_POST: 150,
  LIKE_POST: 160,
  LIKE_COMMENT: 170,
  REPLY_TO_COMMENT: 180,
};

/** Checks whether a notif token is unique and then inserts a token in a DB.
* Returns a promise that resolves when the tokens have been added. */
function addGCMID(userID, token) {
  var deferred = q.defer();
  async.waterfall([
    // Perform unique check manually on the notification token (MySQL has a
    // unique field length limit)
    function(callback) {
      knex('notification_tokens').select(['token'])
        .where({ user_id: userID, type: 'GCM' })
        .then(function(res) {
          for (var ii = 0; ii < res.length; ++ii) {
            if (res[ii].token === token) {
              return callback(null, false); // We shouldn't insert this notif token
            }
          }
          return callback(null, true);
        });
    },

    // Add GCM ID
    function(shouldInsert, callback) {
      if (!shouldInsert) { return callback(null); }
      knex('notification_tokens').insert({
        user_id: userID,
        token: token,
        type: 'GCM'
      }).then(function() {
        return callback(null);
      });
    },

    function(callback) {
      deferred.resolve();
    }], function(err, result) {
      deferred.reject(err);
    });
  return deferred.promise;
}

function getNotificationTypeDescription(type) {
  for (var k in notificationTypes) {
    if (notificationTypes[k] === type) {
      return k;
    }
  }
  return 'UNKNOWN ' + type;
}

function sendPushNotifications(message){
  return function(notificationTokens) {
    var subtasks = [];
    for (var j = 0; j < notificationTokens.length; j++) {
      var task = firebase.sendPushNotification(notificationTokens[j].token, {
        "title": message,
        "sound": 1,
        "icon": 1,
      });
      subtasks.push(task);
    }
    return Promise.all(subtasks);
  };
}

function simpleErrorPassthrough(error){
  return Promise.reject(error);
}

/**
 * Send a notification to a list of users (both in-app and push)
 * @param fromID The ID of the user who caused this notif to be sent. Doesn't
 *               have to be supplied, but if it is, will be used to check
 *               whether the user is blocked or not.
 * @return A promise containing all the push notification tasks
 */
function sendNotifications(userIDs, notification, message, app, fromID) {
  var deferred = q.defer();

  log.info("Notif message: " + message);

  if (typeof fromID === "undefined") {
    fromID = 0;
  }

  knex.select('other_user_id as id').from('blocked_users').where('user_id', fromID).union(function() {
    this.select('user_id as id').from('blocked_users').where('other_user_id', fromID);
  }).then(function(results){
    var tasks = [];
    var ids = results.map(function(row){
      return row.id;
    });

    userIDs.forEach(function(thisUserID){
      if(ids.indexOf(thisUserID) >= 0) {
        return;
      }

      var data = notification.data;
      if(typeof data === 'object') {
        data = JSON.stringify(data);
      }

      var task = knex('notifications').returning('id').insert({
        user_id: thisUserID,
        type: notification.type,
        notification_type: getNotificationTypeDescription(notification.type),
        time: notification.timestamp,
        created_at: moment().format("HH:mm:ss MM-DD-YYYY"),
        updated_at: null,
        pretty_message: message,
        data: data
      }).then(function(ids) {
        var id = ids[0];
        var notificationDataObject = null;
        if (typeof notification.data === 'object') {
          notificationDataObject = notification.data;
        } else {
          notificationDataObject = JSON.parse(notification.data);
        }

        notificationDataObject.ID = id;
        notificationDataObject.FromUserID = thisUserID;
        notificationDataObject.Processed = false;
        notificationDataObject.Seen = false;

        notification.ID = id;
        notification.FromUserID = thisUserID;
        notification.Processed = false;
        notification.Seen = false;
        notification.data = JSON.stringify(notificationDataObject);

        if (typeof app !== 'undefined') {
          app.sendAsyncMessage(thisUserID, notification);
        }

        return q.when(id);
      });

      tasks.push(task);

      // send push notifications..
      var pushtask = knex.select()
        .from('notification_tokens')
        .where('notification_tokens.user_id', thisUserID)
        .where('notification_tokens.type', 'GCM')
        .then(sendPushNotifications(message), simpleErrorPassthrough);
      // Do we really need to wait for the push notifications ?
      // if not, comment out the line below..
      tasks.push(pushtask);

    });

    Promise.all(tasks).then(function(results){
      deferred.resolve(results);
    }, function(error){
      deferred.reject(error);
    });

  }, function(error){
    deferred.reject(error);
  });

  return deferred.promise;
}


module.exports = {
  sendNotifications: sendNotifications,
  sendPushNotifications: sendPushNotifications,
  notificationTypes: notificationTypes,
  addGCMID: addGCMID
};


