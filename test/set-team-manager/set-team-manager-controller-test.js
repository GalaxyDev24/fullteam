var SetTeamManagerController = require('controllers/set-team-manager-controller');

describe('SetTeamManagerController', function() {
  it('should return error for no params given', function() {
    var params = {
      userID: 1,
      data: {}
    };
    var results = SetTeamManagerController.setTeamManager(params, null, null);
    return results.should.eventually.be.rejected
      .and.should.eventually.have.property('Success', 1);
  });

  it('should return error when you aren\'t the manager', function() {
    var params = {
      userID: 2,
      data: {
        UserID: 4,
        TeamID: 1,
      }
    };
    var results = SetTeamManagerController.setTeamManager(params, null, null);
    return results.should.eventually.be.rejected
      .and.should.eventually.have.property('Success', 2)
  });

  it('should return error when the user given isn\'t part of the team', function() {
    var params = {
      userID: 1,
      data: {
        UserID: 3,
        TeamID: 1,
      }
    };
    var results = SetTeamManagerController.setTeamManager(params, null, null);
    return results.should.eventually.be.rejected
      .and.should.eventually.have.property('Success', 3)
  });

  it('should return success when params are valid', function() {
    var params = {
      userID: 3,
      data: {
        UserID: 7,
        TeamID: 3,
      }
    };
    var results = SetTeamManagerController.setTeamManager(params, null, null);
    return Promise.all([
      results.should.eventually.be.fullfilled,
      results.should.eventually.have.property('Success', 0)
    ]);
  });
});
