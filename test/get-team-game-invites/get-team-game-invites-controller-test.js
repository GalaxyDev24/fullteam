var GetTeamGameInvitesController = require('controllers/get-team-game-invites-controller');

describe('GetTeamGameInvitesController', function() {
  it('should return error for no params given', function() {
    var params = {
      userID: 1,
      data: {}
    };
    var results = GetTeamGameInvitesController.getTeamGameInvites(params, null, null);
    return results.should.eventually.be.rejected
      .and.should.eventually.have.property('Success', 1);
  });
  it('should return error when not part of team', function() {
    var params = {
      userID: 16,
      data: {GameID: 1}
    };
    var results = GetTeamGameInvitesController.getTeamGameInvites(params, null, null);
    return results.should.eventually.be.rejected
      .and.should.eventually.have.property('Success', 2);
  });
  it('should return results for valid game id', function() {
    var params = {
      userID: 1,
      data: {GameID: 1}
    };
    var results = GetTeamGameInvitesController.getTeamGameInvites(params, null, null);
    return Promise.all([
      results.should.eventually.be.fulfilled,
      results.should.eventually.have.property('Success', 0),
      results.should.eventually.have.property('GameInvites').that.has.lengthOf(1)]);
  });
});
