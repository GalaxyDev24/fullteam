var CreateTeamDutyController = require('controllers/create-team-duty-controller');

describe('CreateTeamDutyController', function() {
  it('should return error for no params given', function() {
    var params = {
      userID: 1,
      data: {}
    };
    var results = CreateTeamDutyController.createTeamDuty(params);
    return results.should.eventually.be.rejected
      .and.should.eventually.have.property('Success', 1);
  });
  it('should return error when not the owner of the team', function() {
    var params = {
      userID: 2,
      data: {
        DutyName: "Boot cleanin'",
        TeamID: 1
      }
    };
    var results = CreateTeamDutyController.createTeamDuty(params);
    return results.should.eventually.be.rejected
      .and.should.eventually.have.property('Success', 2);
  });
  it('should return success for valid params', function() {
    var params = {
      userID: 1,
      data: {
        DutyName: "Boot cleanin'",
        TeamID: 1
      }
    };
    var results = CreateTeamDutyController.createTeamDuty(params);
    return Promise.all([
      results.should.eventually.be.fulfilled,
      results.should.eventually.have.property('Success', 0)
    ]);
  });
});
