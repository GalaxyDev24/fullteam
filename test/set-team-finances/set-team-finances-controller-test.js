var SetTeamFinancesController = require('controllers/set-team-finances-controller');

describe('SetTeamFinancesController', function() {
  it('should return failure when no params given', function() {
    var params = {
      data: {},
      userID: 1
    };
    var results = SetTeamFinancesController.getTeamFinances(params);
    return results.should.eventually.be.rejected
      .and.eventually.have.property('Success', 1);
  });
  it('should return failure when not the owner', function() {
    var params = {
      data: {
        TeamID: 1,
        Finances: {
          4: 1,
          5: -1
        }
      },
      userID: 4
    };
    var results = SetTeamFinancesController.getTeamFinances(params);
    return results.should.eventually.be.rejected
      .and.eventually.have.property('Success', 2);
  });
  it('should return success for valid params', function() {
    var params = {
      data: {
        TeamID: 1,
        Finances: {
          4: 1,
          5: -1
        }
      },
      userID: 1
    };
    var results = SetTeamFinancesController.getTeamFinances(params);
    return results.should.eventually.be.fulfilled;
  });
});

