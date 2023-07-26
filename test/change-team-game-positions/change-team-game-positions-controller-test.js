var ChangeTeamGamePositionsController =
    require('controllers/change-team-game-positions-controller');

describe('ChangeTeamGamePositionsController', function() {
  it('should return error for no params given', function() {
    var params = {
      userID: 1,
      data: {}
    };
    var results = ChangeTeamGamePositionsController.changeTeamGamePositions(params);
    return results.should.eventually.be.rejected
      .and.should.eventually.have.property('Success', 1);
  });
  it('should return error when not the owner of the game', function() {
    var params = {
      userID: 1,
      data: {
        GameID: 3,
        Positions: [
          {UserID: 3, Position: 3},
          {UserID: 2, Position: 2},
          {UserID: 1, Position: 1}
        ],
      }
    };
    var results = ChangeTeamGamePositionsController.changeTeamGamePositions(params);
    return results.should.eventually.be.rejected
      .and.should.eventually.have.property('Success', 2);
  });
  it('should return error when positions bad', function() {
    var params = {
      userID: 2,
      data: {
        GameID: 3,
        Positions: [
          {UserID: 3, Position: 101},
          {UserID: 2, Position: 2},
          {UserID: 1, Position: 1}
        ],
      }
    };
    var results = ChangeTeamGamePositionsController.changeTeamGamePositions(params);
    return results.should.eventually.be.rejected
      .and.should.eventually.have.property('Success', 1);
  });
  it('should return error when not enough positions sent', function() {
    var params = {
      userID: 2,
      data: {
        GameID: 3,
        Positions: [
          {UserID: 2, Position: 2},
          {UserID: 1, Position: 1},
        ],
      }
    };
    var results = ChangeTeamGamePositionsController.changeTeamGamePositions(params);
    return results.should.eventually.be.rejected
      .and.should.eventually.have.property('Success', 1);
  });
  it('should return error when wrong IDs sent', function() {
    var params = {
      userID: 2,
      data: {
        GameID: 3,
        Positions: [
          {UserID: 4, Position: 3},
          {UserID: 2, Position: 2},
          {UserID: 1, Position: 1}
        ],
      }
    };
    var results = ChangeTeamGamePositionsController.changeTeamGamePositions(params);
    return results.should.eventually.be.rejected
      .and.should.eventually.have.property('Success', 1);
  });
  it('should return success for valid params', function() {
    var params = {
      userID: 2,
      data: {
        GameID: 3,
        Positions: [
          {UserID: 3, Position: 3},
          {UserID: 2, Position: 2},
          {UserID: 1, Position: 1}
        ],
      }
    };
    var results = ChangeTeamGamePositionsController.changeTeamGamePositions(params);
    return Promise.all([
      results.should.eventually.be.fulfilled,
      results.should.eventually.have.property('Success', 0)
    ]);
  });
});
