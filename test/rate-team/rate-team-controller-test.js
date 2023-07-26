var RateTeamController = require('controllers/rate-team-controller');

describe("RateTeamController", function() {
  it('should return error for no params given', function() {
    var params = {
      userID: 1,
      data: {}
    };
    var results = RateTeamController.rateTeam(params);
    return results.should.eventually.be.rejected
      .and.should.eventually.have.property('Success', 1);
  });
  it('should return error when already rated', function() {
    var params = {
      userID: 1,
      data: {
        TeamID: 1,
        Sportsmanship: 5,
        Teamwork: 5,
        Fitness: 2,
        Reliability: 5,
        FeedbackMessage: "Hey",
      }
    };
    var results = RateTeamController.rateTeam(params);
    return results.should.eventually.be.rejected
      .and.should.eventually.have.property('Success', 2);
  });
  it('should return success for valid params', function() {
    var params = {
      userID: 2,
      data: {
        TeamID: 1,
        Sportsmanship: 5,
        Teamwork: 5,
        Fitness: 2,
        Reliability: 5,
        FeedbackMessage: "Hey",
      }
    };
    var results = RateTeamController.rateTeam(params);
    return Promise.all([
      results.should.eventually.be.fulfilled,
      results.should.eventually.have.property('Success',0)
    ]);
  });
});
