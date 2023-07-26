var UpdateTeamFinancesController = require('controllers/update-team-finances-controller');

describe('UpdateTeamFinancesController', function() {
  it('should return error for no params given', function() {
    var params = {
      userID: 1,
      data: {}
    };
    var results = UpdateTeamFinancesController.updateTeamFinances(params, null, null);
    return results.should.eventually.be.rejected
      .and.should.eventually.have.property('Success', 1);
  });
  it('should return error for invalid params', function() {
    var params = {
      userID: 1,
      data: {
        TeamID: 5
      }
    };
    var results = UpdateTeamFinancesController.updateTeamFinances(params, null, null);
    return results.should.eventually.be.rejected
      .and.should.eventually.have.property('Success', 1);
  });
  it('should return error when team does not exist', function() {
    var params = {
      userID: 5,
      data: {
        TeamID: -1,
        UserID: 5,
        Finances: 0,
      }
    };
    var results = UpdateTeamFinancesController.updateTeamFinances(params, null, null);
    return results.should.eventually.be.rejected
      .and.should.eventually.have.property('Success', 2);
  });
  it('should return error when user is not the owner of team', function() {
    var params = {
      userID: 1,
      data: {
        TeamID: 5,
        UserID: 5,
        Finances: 0
      }
    };
    var results = UpdateTeamFinancesController.updateTeamFinances(params, null, null);
    return results.should.eventually.be.rejected
      .and.should.eventually.have.property('Success', 3);
  });

  it('should return error when player not part of team', function() {
    var params = {
      userID: 1,
      data: {
        TeamID: 1,
        UserID: -1,
        Finances: 5
      }
    };
    var results = UpdateTeamFinancesController.updateTeamFinances(params, null, null);
    return results.should.eventually.be.rejected
      .and.should.eventually.have.property('Success', 4);
  });
  it('should return finances for valid params', function() {
    var params = {
      userID: 1,
      data: {
        TeamID: 1,
        UserID: 1,
        Finances: 5
      }
    };

    var results1 = UpdateTeamFinancesController.updateTeamFinances(params, null, null);

    params = {
      userID: 1,
      data: {
        TeamID: 1,
        UserID: 4,
        Finances: 0
      }
    };

    var results2 = UpdateTeamFinancesController.updateTeamFinances(params, null, null);

    params = {
      userID: 1,
      data: {
        TeamID: 1,
        UserID: 5,
        Finances: -5
      }
    };

    var results3 = UpdateTeamFinancesController.updateTeamFinances(params, null, null);

    return Promise.all([
      results1.should.eventually.be.fulfilled,
      results1.should.eventually.have.property('Success', 0),
      results2.should.eventually.be.fulfilled,
      results2.should.eventually.have.property('Success', 0),
      results3.should.eventually.be.fulfilled,
      results3.should.eventually.have.property('Success', 0)]);
  });
});
