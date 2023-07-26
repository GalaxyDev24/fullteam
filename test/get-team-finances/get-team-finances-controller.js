var GetTeamFinancesController = require('controllers/get-team-finances-controller');

describe('GetTeamFinancesController', function() {
  it('should return error for no params given', function() {
    var params = {
      userID: 1,
      data: {}
    };
    var results = GetTeamFinancesController.getTeamFinances(params, null, null);
    return results.should.eventually.be.rejected
      .and.should.eventually.have.property('Success', 1);
  });
  it('should return error when not part of team', function() {
    var params = {
      userID: 1,
      data: {TeamID: 5}
    };
    var results = GetTeamFinancesController.getTeamFinances(params, null, null);
    return results.should.eventually.be.rejected
      .and.should.eventually.have.property('Success', 2);
  });
  it('should return finances for valid team id', function() {
    var params = {
      userID: 17,
      data: {TeamID: 5}
    };
    var results = GetTeamFinancesController.getTeamFinances(params, null, null);
    return Promise.all([
      results.should.eventually.be.fulfilled,
      results.should.eventually.have.property('Success', 0),
      results.should.eventually.have.property('Finances').that.has.lengthOf(9)])
  });
});
