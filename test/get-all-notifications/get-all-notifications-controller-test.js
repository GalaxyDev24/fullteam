var GetAllNotificationsController =
    require('controllers/get-all-notifications-controller');

describe('GetAllNotificationsController', function() {
  it('should return notifications for a user, and always succeed', function() {
    var packet = {
      userID: 1,
      data: {}
    };
    var results = GetAllNotificationsController.getAllNotifications(packet);
    return Promise.all([
      expect(results).to.eventually.have.property('Success', 0),
      expect(results).to.eventually.have.property('Notifications')
    ]);
  });
});
