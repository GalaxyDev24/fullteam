var RespondToTeamTrainingController =
    require('controllers/respond-to-team-training-controller');

describe('RespondToTeamTrainingController', function() {
  it('should return error for no params given', function() {
    var params = {
      userID: 4,
      data: {}
    };
    var results = RespondToTeamTrainingController.respondToTeamTraining(params);
    return results.should.eventually.be.rejected
      .and.should.eventually.have.property('Success', 1);
  });
  it('should return error when not part of the team', function() {
    var params = {
      userID: 17,
      data: {TeamID: 4, Response: 2,}
    };
    var results = RespondToTeamTrainingController.respondToTeamTraining(params);
    return results.should.eventually.be.rejected
      .and.should.eventually.have.property('Success', 2);
  });
  it('should return error when there is no team training for this team', function() {
    var params = {
      userID: 17,
      data: {TeamID: 5, Response: 2,}
    };
    var results = RespondToTeamTrainingController.respondToTeamTraining(params);
    return results.should.eventually.be.rejected
      .and.should.eventually.have.property('Success', 3);
  });
  it('should return error when this team\'s training is outdated', function() {
    var params = {
      userID: 7,
      data: {TeamID: 3, Response: 2,}
    };
    var results = RespondToTeamTrainingController.respondToTeamTraining(params);
    return results.should.eventually.be.rejected
      .and.should.eventually.have.property('Success', 3);
  });
  it('should return error when Response is out of range (> 2, < 0)', function() {
    var params = {
      userID: 1,
      data: {TeamID: 4, Response: 4,}
    };
    var results = RespondToTeamTrainingController.respondToTeamTraining(params);
    return results.should.eventually.be.rejected
      .and.should.eventually.have.property('Success', 1);
  });
  it('should return success when all params correct', function() {
    var params = {
      userID: 1,
      data: {TeamID: 4, Response: 2,}
    };
    var results = RespondToTeamTrainingController.respondToTeamTraining(params);
    return Promise.all([
      results.should.eventually.be.fulfilled,
      results.should.eventually.have.property('Success', 0),
    ]);
  });
});

