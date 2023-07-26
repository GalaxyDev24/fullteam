var GetTeamDutiesController = require('controllers/get-team-duties-controller');

describe('GetTeamDutiesController', function() {
  it('should return err for no params', function() {
    var params = {
      userID: 1,
      data: {},
    };
    var results = GetTeamDutiesController.getTeamDuties(params);
    return results.should.eventually.be.rejected
      .and.eventually.have.property('Success', 1);
  });
  it('should return err if not in team', function() {
    var params = {
      userID: 1,
      data: {TeamID: 3},
    };
    var results = GetTeamDutiesController.getTeamDuties(params);
    return results.should.eventually.be.rejected
      .and.eventually.have.property('Success', 2);
  });
  it('should return success for valid params', function() {
    var params = {
      userID: 1,
      data: {TeamID: 1},
    };
    var results = GetTeamDutiesController.getTeamDuties(params);
    return Promise.all([
      results.should.eventually.be.fulfilled,
      results.should.eventually.have.property('Success', 0),
    ]);
  });
});
