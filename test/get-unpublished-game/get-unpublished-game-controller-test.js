var GetUnpublishedGameController = require('controllers/get-unpublished-game-controller');

describe('GetUnpublishedGameController', function() {
  it('should return an error when invalid params given', function() {
    var packet = {
      userID: 1,
      data: {}
    };
    var results = GetUnpublishedGameController.getUnpublishedGame(packet);
    return results.should.eventually.be.rejected.
      and.should.eventually.have.property('Success', 1);
  });
  it('should return an error when you are not the manager of the team', function() {
    var packet = {
      userID: 2,
      data: {
        TeamID: 1
      }
    };
    var results = GetUnpublishedGameController.getUnpublishedGame(packet);
    return results.should.eventually.be.rejected.
      and.should.eventually.have.property('Success', 2);
  });

  it('should return success with valid params', function() {
    var packet = {
      userID: 2,
      data: {
        TeamID: 2
      }
    };
    var results = GetUnpublishedGameController.getUnpublishedGame(packet);

    return Promise.all([
      results.should.eventually.be.fulfilled,
      results.should.eventually.have.property('Success', 0),
    ]);
  });
});
