var GetUnreadNotificationsController =
    require('controllers/get-unread-notifications-controller');

describe('GetUnreadNotificationsController', function() {
  it('should return notifications for a user, and always succeed', function() {
    var packet = {
      userID: 1,
      data: {}
    };
    var results = GetUnreadNotificationsController.getUnreadNotifications(packet);
    return Promise.all([
      expect(results).to.eventually.have.property('Success', 0),
      expect(results).to.eventually.have.property('Notifications')
    ]);
  });
});
