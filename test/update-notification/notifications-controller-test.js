var UpdateNotificationsController =
    require('controllers/notifications-controller');

describe('UpdateNotificationsController', function() {
  it('Update notifications should return error when invalid params', function() {
    var packet = {
      userID: 1,
      data: {
        // NotificationID: 2
      }
    };
    var results = UpdateNotificationsController.updateNotification(packet);
    return results.should.eventually.be.rejected.and.have.property('Success', 1);
  });

  it('Update notifications should return error when notification does not exist', function() {
    var packet = {
      userID: 1,
      data: {
        NotificationID: -1
      }
    };
    var results = UpdateNotificationsController.updateNotification(packet);
    return results.should.eventually.be.rejected.and.have.property('Success', 2);
  });

  it('Update notifications should return error when notification is not user s notification', function() {
    var packet = {
      userID: 1,
      data: {
        NotificationID: 1
      }
    };
    var results = UpdateNotificationsController.updateNotification(packet);
    return results.should.eventually.be.rejected.and.have.property('Success', 3);
  });

  it('Update notifications should return Success with valid params', function() {
    var packet = {
      userID: 1,
      data: {
        NotificationID: 2
      }
    };
    var results = UpdateNotificationsController.updateNotification(packet);
    return results.should.eventually.be.fulfilled.and.have.property('Success', 0);
  });

});