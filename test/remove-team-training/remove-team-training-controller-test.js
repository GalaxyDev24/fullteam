var RemoveTeamTrainingController = require('controllers/remove-team-training-controller');

describe('RemoveTeamTrainingController', function() {
  it('should return error for no params given', function() {
    var params = {
      userID: 1,
      data: {}
    };
    var results = RemoveTeamTrainingController.removeTeamTraining(params);
    return results.should.eventually.be.rejected
      .and.should.eventually.have.property('Success', 1);
  });
  it('should return error when not the owner of the team', function() {
    var params = {
      userID: 1,
      data: {TeamID: 2,}
    };
    var results = RemoveTeamTrainingController.removeTeamTraining(params);
    return results.should.eventually.be.rejected
      .and.should.eventually.have.property('Success', 2);
  });
  it('should return success if all params correct', function() {
    var params = {
      userID: 2,
      data: {TeamID: 2,}
    };
    var results = RemoveTeamTrainingController.removeTeamTraining(params);
    return Promise.all([
      results.should.eventually.be.fulfilled,
      results.should.eventually.have.property('Success', 0),
    ]);
  });
});
