var RemoveDutyController = require('controllers/remove-duty-controller');

describe('RemoveDutyController', function() {
  it('should return error for no params given', function() {
    var params = {
      userID: 2,
      data: {}
    };
    var results = RemoveDutyController.removeDuty(params);
    return results.should.eventually.be.rejected
      .and.should.eventually.have.property('Success', 1);
  });
  it('should return error when not the owner of the team', function() {
    var params = {
      userID: 1,
      data: {
        DutyID: 2,
      }
    };
    var results = RemoveDutyController.removeDuty(params);
    return results.should.eventually.be.rejected
      .and.should.eventually.have.property('Success', 2);
  });
  it('should return failure when duty doesn\'t exist', function() {
    var params = {
      userID: 2,
      data: {
        DutyID: 223123,
      }
    };
    var results = RemoveDutyController.removeDuty(params);
    return results.should.eventually.be.rejected
      .and.should.eventually.have.property('Success', 3);
  });
  it('should return success for valid params', function() {
    var params = {
      userID: 2,
      data: {
        DutyID: 2,
      }
    };
    var results = RemoveDutyController.removeDuty(params);
    return Promise.all([
      results.should.eventually.be.fulfilled,
      results.should.eventually.have.property('Success', 0)
    ]);
  });
});
