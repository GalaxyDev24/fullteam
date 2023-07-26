var CreateTeamGameController = require('controllers/create-team-game-controller');
var config = require('config');

describe('CreateTeamGameController', function() {
  it('should return an error when invalid params given', function() {
    var packet = {
      userID: 1,
      data: {}
    };
    var results = CreateTeamGameController.createTeamGame(packet);
    return results.should.eventually.be.rejected.
      and.should.eventually.have.property('Success', 1);
  });
  it('should return an error when you aren\'t team manager', function() {
    var packet = {
      userID: 1,
      data: {
        TeamID: 2,
        GameTime: 0,
        HasTransport: false,
        MeetingPlace: "asdMP",
        Description: "asdDESC",
        IsCustomVenue: true,
        Lat: 0,
        Lon: 0,
        SurfaceType: 0,
        AvgAbility: 0.5,
        Cost: 0,
        ShinPads: false,
        GameType: "Competitive",
      }
    };
    var results = CreateTeamGameController.createTeamGame(packet);
    return results.should.eventually.be.rejected.
      and.should.eventually.have.property('Success', 2);
  });

  it('should return success with valid params', function() {
    var packet = {
      userID: 1,
      data: {
        TeamID: 1,
        GameTime: 0,
        HasTransport: false,
        MeetingPlace: "asdMP",
        Description: "asdDESC",
        IsCustomVenue: true,
        Lat: 0,
        Lon: 0,
        SurfaceType: 0,
        AvgAbility: 0.5,
        Cost: 0,
        ShinPads: false,
        GameType: "Friendly",
        PictureURL: config.baseUrl + "UserUploads/10NvyEQlURSalNKlpxCMBuEf7vUer5lWDuRH2uUF.jpg",
        CoverPictureURL: config.baseUrl + "UserUploads/10NvyEQlURSalNKlpxCMBuEf7vUer5lWDuRH2uUF.jpg",
      }
    };
    var results = CreateTeamGameController.createTeamGame(packet);
    return Promise.all([
      results.should.eventually.be.fulfilled,
      results.should.eventually.have.property('Success', 0),
    ]);
  });
});
