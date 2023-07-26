var NotificationService = require('services/notification-service')
var firebase = require('helpers/firebase');

function sendTrainingNotif(app, userIDs, teamID, teamName, pictureURL, message) {
  var notification = {
    timestamp: (new Date()).getTime(),
    type: NotificationService.notificationTypes.TEAM_TRAINING_SCHEDULED,
    data: JSON.stringify({
      TeamID: teamID,
      TeamName: teamName,
      PictureURL: pictureURL
    }),
  };
  return Promise.all([
    NotificationService.sendNotifications(
      userIDs,
      notification,
      message,
      app),
    firebase.sendPushNotificationsNoGCM(userIDs, {
      title: "Training scheduled",
      body: message,
    }),
  ]);
}

module.exports = {
  sendTrainingNotif: sendTrainingNotif,
};
