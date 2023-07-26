var BlockUserController = require('controllers/block-user-controller');

describe('BlockUserController', function() {
  it('should return failure for no params given', function() {
    var packet = {
      userID: 1,
      data: {}
    };
    var results = BlockUserController.blockUser(packet, null, null);
    return results.should.eventually.be.rejected.and.eventually.have.property('Success', 1);
  });
  it('should return success for valid params', function() {
    var packet = {
      userID: 1,
      data: {UserID: 2}
    };
    var results = BlockUserController.blockUser(packet, null, null);
    return results.should.eventually.have.property('Success', 0);
  });
  it('should return failure for already blocked', function() {
    var packet = {
      userID: 1,
      data: {UserID: 2}
    };
    var results = BlockUserController.blockUser(packet, null, null);
    return results.should.eventually.be.rejected.and.eventually.have.property('Success', 2);
  });
  it('should return failure for blocking yourself', function() {
    var packet = {
      userID: 1,
      data: {UserID: 1}
    };
    var results = BlockUserController.blockUser(packet, null, null);
    return results.should.eventually.be.rejected.and.eventually.have.property('Success', 1);
  });
});
