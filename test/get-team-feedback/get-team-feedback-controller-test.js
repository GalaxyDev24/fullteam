var GetTeamFeedbackController = require('controllers/get-team-feedback-controller');

describe("GetTeamFeedbackController", function() {
  it('should return error for invalid params', function() {
    var params = {
      userID: 1,
      data: {}
    };
    var results = GetTeamFeedbackController.getTeamFeedback(params);
    return results.should.eventually.be.rejected
      .and.should.eventually.have.property('Success', 1);
  });
  it('should return success for valid params', function() {
    var params = {
      userID: 1,
      data: {TeamID: 1}
    };
    var results = GetTeamFeedbackController.getTeamFeedback(params);
    return Promise.all([
      results.should.eventually.be.fulfilled,
      results.should.eventually.have.property('Success', 0),
      results.should.eventually.have.property('Feedbacks').that.has.lengthOf(1)
    ]);
  });
});
