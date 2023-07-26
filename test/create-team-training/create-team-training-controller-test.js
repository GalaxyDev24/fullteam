var CreateTeamTrainingController = require('controllers/create-team-training-controller');

describe('CreateTeamTrainingController', function() {
  it('should return error for no params given', function() {
    var params = {
      userID: 1,
      data: {}
    };
    var results = CreateTeamTrainingController.createTeamTraining(params);
    return results.should.eventually.be.rejected
      .and.should.eventually.have.property('Success', 1);
  });
  it('should return error when not the owner of the team', function() {
    var params = {
      userID: 2,
      data: {
        TeamID: 1,
        GameTime: (new Date()).getTime() + 100000,
        Cost: 5.50,
        Description: "A test game",
        IsCustomVenue: false,
        Lat: 100.123,
        Lon: 120.123,
        GameType: "Training"
      }
    };
    var results = CreateTeamTrainingController.createTeamTraining(params);
    return results.should.eventually.be.rejected
      .and.should.eventually.have.property('Success', 2);
  });
  it('should return error if custom venue set but no venue provided', function() {
    var params = {
      userID: 1,
      data: {
        TeamID: 1,
        GameTime: (new Date()).getTime() + 100000,
        Cost: 5.50,
        Description: "A test game",
        IsCustomVenue: true,
        Lat: 100.123,
        Lon: 120.123,
        GameType: "Training"
      }
    };
    var results = CreateTeamTrainingController.createTeamTraining(params);
    return results.should.eventually.be.rejected
      .and.should.eventually.have.property('Success', 3);
  });
  it('should return success if all params correct', function() {
    var params = {
      userID: 1,
      data: {
        TeamID: 1,
        GameTime: (new Date()).getTime() + 100000,
        Cost: 5.50,
        Description: "A test game",
        IsCustomVenue: false,
        Lat: 100.123,
        Lon: 120.123,
        GameType: "Training"
      }
    };
    var results = CreateTeamTrainingController.createTeamTraining(params);
    return Promise.all([
      results.should.eventually.be.fulfilled,
      results.should.eventually.have.property('Success', 0),
    ]);
  });
});
