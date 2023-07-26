var GetTeamUpcomingGamesController = require('controllers/get-team-upcoming-games-controller');

describe('GetTeamUpcomingGamesController', function() {
  it('should return an error when invalid params given', function() {
    var packet = {
      userID: 1,
      data: {}
    };
    var results = GetTeamUpcomingGamesController.getTeamUpcomingGames(packet);
    return results.should.eventually.be.rejected.
      and.should.eventually.have.property('Success', 1);
  });
  it('should return an error when you aren\'t in the team', function() {
    var packet = {
      userID: 2,
      data: {TeamID: 1, IsTraining: false}
    };
    var results = GetTeamUpcomingGamesController.getTeamUpcomingGames(packet);
    return results.should.eventually.be.rejected.
      and.should.eventually.have.property('Success', 2);
  });

  it('should return error when no team game exists', function() {
    var packet = {
      userID: 7,
      data: {TeamID: 3, IsTraining: false}
    };
    var results = GetTeamUpcomingGamesController.getTeamUpcomingGames(packet);
    return results.should.eventually.be.rejected.
      and.should.eventually.have.property('Success', 3);
  });

  it('should return success with valid params', function() {
    var packet = {
      userID: 2,
      data: {TeamID: 2, IsTraining: false}
    };
    var results = GetTeamUpcomingGamesController.getTeamUpcomingGames(packet);
    return Promise.all([
      results.should.eventually.be.fulfilled,
      results.should.eventually.have.property('Success', 0),
    ]);
  });
});
