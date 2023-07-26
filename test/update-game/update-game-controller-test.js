var UpdateGameController = require('controllers/update-game-controller');

describe('UpdateGameController', function() {
  it('should return an error when invalid params given', function() {
    var packet = {
      userID: 1,
      data: {}
    };
    var results = UpdateGameController.updateGame(packet);
    return results.should.eventually.be.rejected.
      and.should.eventually.have.property('Success', 1);
  });
  it('should return an error when you are not the owner of the game', function() {
    var packet = {
      userID: 3,
      data: {
        GameID: 1
      }
    };
    var results = UpdateGameController.updateGame(packet);
    return results.should.eventually.be.rejected.
      and.should.eventually.have.property('Success', 2);
  });

  it('should return success with valid params', function() {
    var packet = {
      userID: 2,
      data: {
        GameID: 2,
        IsPublished: true
      }
    };
    var results = UpdateGameController.updateGame(packet);

    return Promise.all([
      results.should.eventually.be.fulfilled,
      results.should.eventually.have.property('Success', 0),
    ]);
  });
});
