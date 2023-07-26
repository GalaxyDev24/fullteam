var knex = require('lib/knex'),
    q = require('q');

var app = require('lib/application');
var sinon = require('sinon');
var proxyquire = require('proxyquire');
var chai = require('chai');
var expect = chai.expect;
var teamController = require('controllers/team-controller');
var util = require('util');
var config = require('config');

describe('TeamController', function() {

  var firebase = {};
  var controller;
  // firebase.sendPushNotification = function(gcmid, data) {
  //     sendPushNotificationStub();
  //     console.log('=fake:' + gcmid);
  // };

  var sandbox;

  beforeEach(function() {
    sandbox = sinon.sandbox.create();
    sandbox.stub(app, "getConnectionKeys", function(userID){
      return [userID];
    });

    sandbox.stub(app, "sendAsyncMessage", function(userID, data){
      return userID;
    });

    controller = proxyquire('controllers/team-controller', {
      'helpers/firebase': firebase
    });

    firebase.sendPushNotification = sinon.spy(function(a, b){
      console.log(a);
    });

    // firebase.sendPushNotification = function(a,b) {
    //     console.log(a);
    // }

  });

  afterEach(function() {
    sandbox.restore();
  });

  var packet = {
    userID: 1,
    data: {}
  };

  it('createTeam() should return failure for no params', function() {
    var results = controller.createTeam(packet);
    return results.should.eventually.be.rejected;
  });

  it('createTeam() should return Success for valid params', function() {
    packet.data = {
      'Name': 'Union Vale FC',
      'TeamSize': 11
    };

    var results = controller.createTeam(packet);
    return results.should.eventually.be.fulfilled;
  });

  it('createTeam() should return Success for valid params with team pictures and location', function() {
    packet.data = {
      'Name': 'Union Vale FC1',
      'TeamSize': 11,
      'Picture': config.baseUrl + "UserUploads/10NvyEQlURSalNKlpxCMBuEf7vUer5lWDuRH2uUF.jpg",
      'CoverPicture': config.baseUrl + "UserUploads/10NvyEQlURSalNKlpxCMBuEf7vUer5lWDuRH2uUF.jpg",
      'Lat': -20.238238199999998,
      'Lon': 57.4910697
    };

    var results = controller.createTeam(packet);
    return results.should.eventually.be.fulfilled;
  });

  it('getOwnedTeams() should return list of current users owned teams.', function() {
    packet.data = {};
    var results = controller.getOwnedTeams(packet);
    return results.should.eventually.be.fulfilled;
  });

  it('getTeams() should return list of current users teams.', function() {
    packet.data = {};
    var results = controller.getTeams(packet);
    return results.should.eventually.be.fulfilled;
  });

  it('getAssociatedTeams() should return failure for invalid params', function() {
    packet.data = {};
    var results = controller.getAssociatedTeams(packet);
    return results.should.eventually.be.rejected;
  });

  it('getAssociatedTeams() should return list of current users teams.', function() {
    packet.data = {
      UserID: 3,
    };
    var results = controller.getAssociatedTeams(packet);
    return results.should.eventually.be.fulfilled;
  });

  it('inviteToTeam() should return failure for invalid data.', function() {
    packet.data = {};
    var results = controller.inviteToTeam(packet);

    packet.data = {
      TeamID: -1,
    };

    var results1 = controller.inviteToTeam(packet);

    packet.data = {
      TeamID: 1,
      UserIDs: null,
    };

    var results2 = controller.inviteToTeam(packet);

    packet.data = {
      TeamID: 1,
      UserIDs: [],
    };

    var results3 = controller.inviteToTeam(packet);

    packet.data = {
      TeamID: 1,
      UserIDs: [{}],
    };

    var results4 = controller.inviteToTeam(packet);

    packet.data = {
      TeamID: 1,
      UserIDs: [{
        UserID: 1,
      }],
    };
    var results5 = controller.inviteToTeam(packet);

    packet.data = {
      TeamID: 1,
      UserIDs: [{
        UserID: 1,
        PositionID: -2,
      }],
    };

    var results6 = controller.inviteToTeam(packet);

    return Promise.all([
      results.should.eventually.be.rejected,
      results1.should.eventually.be.rejected,
      results2.should.eventually.be.rejected,
      results3.should.eventually.be.rejected,
      results4.should.eventually.be.rejected,
      results5.should.eventually.be.rejected,
      results6.should.eventually.be.rejected,
    ]);
  });

  it('inviteToTeam() should return failure for non existant team.', function() {

    packet.data = {
      TeamID: 99999,
      UserIDs: [{
        UserID: 1,
        PositionID: 0,
      }],
    };

    var results1 = controller.inviteToTeam(packet);

    return Promise.all([
      results1.should.eventually.be.rejected,
    ]);
  });

  it('inviteToTeam() should return failure for team non belonging to current user', function() {

    packet.data = {
      TeamID: 2,
      UserIDs: [{
        UserID: 1,
        PositionID: 0,
      }],
    };

    var results1 = controller.inviteToTeam(packet);

    return Promise.all([
      results1.should.eventually.be.rejected,
    ]);
  });

  it('inviteToTeam() should return Success for valid data.', function() {
    packet.data = {
      TeamID: 1,
      UserIDs: [{
        UserID: 1,
        PositionID: 0,
      }, {
        UserID: 2,
        PositionID: 2,
      }, {
        UserID: 3,
        PositionID: 3,
      }, {
        UserID: 4,
        PositionID: 4,
      }, {
        UserID: 5,
        PositionID: 5,
      }, {
        UserID: 6,
        PositionID: 6,
      }, {
        UserID: 7,
        PositionID: 7,
      }, {
        UserID: 8,
        PositionID: 8,
      }, {
        UserID: 9,
        PositionID: 9,
      }, {
        UserID: 10,
        PositionID: 10,
      }, {
        UserID: 11,
        PositionID: 11,
      }, {
        UserID: 12,
        PositionID: 12,
      }],
    };

    var results1 = controller.inviteToTeam(packet, {}, app);

    return Promise.all([
      results1.should.eventually.be.fulfilled,
    ]).then(function(values) {
      // app.sendAsyncMessage.should.have.callCount(5);
      // expect(firebase.sendPushNotification).callCount(2);
    });
  });


  it('getTeamPlayers() should return error for invalid team.', function() {

    packet.data = {
      TeamID: 0
    };

    var results1 = controller.getTeamPlayers(packet, {}, app);

    return Promise.all([
      results1.should.eventually.be.rejected
    ]).then(function(values) {
    });

  });

  it('getTeamPlayers() should return more than 13 players for team id 1.', function() {

    packet.data = {
      TeamID: 1
    };

    var results1 = controller.getTeamPlayers(packet, {}, app);

    return Promise.all([
      results1.should.eventually.be.fulfilled
        .and.to.have.property('Players')
        .that.is.an('array')
        .with.length.above(13)

    ]).then(function(values) {

    });

  }); 

  it('getTeamPlayers() should return empty array for team id 6.', function() {

    packet.data = {
      TeamID: 6
    };

    var results1 = controller.getTeamPlayers(packet, {}, app);

    return Promise.all([
      results1.should.eventually.be.fulfilled
        .and.to.have.property('Players')
        .that.is.an('array')
        .with.lengthOf(0)

    ]).then(function(values) {

    });

  });


  it('getTeamPlayers() should return 17 players for team id 4.', function() {

    packet.data = {
      TeamID: 4
    };

    var results1 = controller.getTeamPlayers(packet, {}, app);

    return Promise.all([
      results1.should.eventually.be.fulfilled
        .and.to.have.property('Players')
        .that.is.an('array')
        .with.lengthOf(17)

    ]).then(function(values) {

    });

  });


  it('getUnconfirmedTeamPlayers() should return 5 players for team id 1.', function() {

    packet.data = {
      TeamID: 1
    };

    var results1 = controller.getUnconfirmedTeamPlayers(packet, {}, app);

    return Promise.all([
      results1.should.eventually.be.fulfilled
        .and.to.have.property('Players')
        .that.is.an('array')
        //.with.lengthOf(5)

    ]).then(function(values) {

    });

  });



  it('getUnconfirmedTeamPlayers() should return 6 players for team id 2.', function() {

    packet.data = {
      TeamID: 2
    };

    var results1 = controller.getUnconfirmedTeamPlayers(packet, {}, app);

    return Promise.all([
      results1.should.eventually.be.fulfilled
        .and.to.have.property('Players')
        .that.is.an('array')
        .with.lengthOf(6)

    ]);

  });


  it('getUnconfirmedTeamPlayers() should return an empty array of players for team id 6.', function() {

    packet.data = {
      TeamID: 6
    };

    var results1 = controller.getUnconfirmedTeamPlayers(packet, {}, app);

    return Promise.all([
      results1.should.eventually.be.fulfilled
        .and.to.have.property('Players')
        .that.is.an('array')
        .with.lengthOf(0)

    ]);

  });

  it('getUnconfirmedTeamPlayers() should return an array of 1 player for team id 3.', function() {

    packet.data = {
      TeamID: 3
    };

    var results1 = controller.getUnconfirmedTeamPlayers(packet, {}, app);

    return Promise.all([
      results1.should.eventually.be.fulfilled
        .and.to.have.property('Players')
        .that.is.an('array')
        .with.lengthOf(1)

    ]);

  });

  it('changeTeamName() should return failure for missing team name.', function() {
    packet.data = {
      TeamID: 1
    };
    var results1 = controller.changeTeamName(packet, {}, app);
    return results1.should.eventually.be.rejected.and.have.property('Description').that.equal('Invalid Parameters');
  });

  it('changeTeamName() should return failure for invalid team.', function() {
    packet.data = {
      TeamID: 0,
      TeamName: 'Changed Name'
    };
    var results1 = controller.changeTeamName(packet, {}, app);
    return results1.should.eventually.be.rejected.and.have.property('Description').that.equal('Invalid Parameters');
  });

  it('changeTeamName() should return failure for non existant team.', function() {

    packet.data = {
      TeamID: 99999,
      TeamName: 'Changed Name'
    };

    var results = controller.changeTeamName(packet, {}, app);

    return results.should.eventually.be.rejected
      .and.have.property('Description')
      .that.equal('Team no longer exists!');
  });

  it('changeTeamName() should return Success for valid team.', function() {

    packet.data = {
      TeamID: 1,
      TeamName: 'Changed Name'
    };

    var results = controller.changeTeamName(packet, {}, app);

    return Promise.all([
      results.should.eventually.be.rejected.and.deep.equal(1)
    ]).then(function(values) {
      return knex('teams').select().where('id', packet.data.TeamID).first().then(function(team){
        return team.name.should.equal(packet.data.TeamName);
      });
    }, function(errors){
      console.log(errors);
    });

  });

  /*
   * Change Team Location
   */ 

  it('changeTeamLocation() should return failure for missing Lat & Lon parameter.', function() {
    packet.data = {
      TeamID: 1
    };
    var results1 = controller.changeTeamLocation(packet, {}, app);
    return results1.should.eventually.be.rejected.and.have.property('Description').that.equal('Invalid Parameters');
  });

  it('changeTeamLocation() should return failure for missing Lon parameter.', function() {
    packet.data = {
      TeamID: 1,
      Lat: 0,
    };
    var results1 = controller.changeTeamLocation(packet, {}, app);
    return results1.should.eventually.be.rejected.and.have.property('Description').that.equal('Invalid Parameters');
  });

  it('changeTeamLocation() should return failure for missing Lat parameter.', function() {
    packet.data = {
      TeamID: 1,
      Lon: 0,
    };
    var results1 = controller.changeTeamLocation(packet, {}, app);
    return results1.should.eventually.be.rejected.and.have.property('Description').that.equal('Invalid Parameters');
  });


  it('changeTeamLocation() should return failure for invalid team.', function() {
    packet.data = {
      TeamID: 0,
      Lat: 0,
      Lon: 0,
    };
    var results1 = controller.changeTeamLocation(packet, {}, app);
    return results1.should.eventually.be.rejected.and.have.property('Description').that.equal('Invalid Parameters');
  });

  it('changeTeamLocation() should return failure for non existant team.', function() {

    packet.data = {
      TeamID: 99999,
      Lat: 0,
      Lon: 0,
    };

    var results = controller.changeTeamLocation(packet, {}, app);

    return results.should.eventually.be.rejected
      .and.have.property('Description')
      .that.equal('Team no longer exists!');
  });

  it('changeTeamLocation() should return Success for valid team (1).', function() {

    packet.data = {
      TeamID: 1,
      Lat: 0,
      Lon: 0,
    };

    var results = controller.changeTeamLocation(packet, {}, app);

    return Promise.all([
      results.should.eventually.be.fulfilled
    ]).then(function(values) {
      return knex('teams').select().where('id', packet.data.TeamID).first().then(function(team){
        team.lat.should.equal(packet.data.Lat);
        team.lon.should.equal(packet.data.Lon);
      });
    });

  });

  it('changeTeamLocation() should return Success for valid team (2).', function() {

    packet.data = {
      TeamID: 1,
      Lat: 2,
      Lon: 2,
    };

    var results = controller.changeTeamLocation(packet, {}, app);

    return Promise.all([
      results.should.eventually.be.fulfilled
    ]).then(function(values) {
      return knex('teams').select().where('id', packet.data.TeamID).first().then(function(team){
        team.lat.should.equal(packet.data.Lat);
        team.lon.should.equal(packet.data.Lon);
      });
    });

  });


  /*
   * removeFromTeam
   */

  it('removeFromTeam() should return failure for missing UserID parameter.', function() {
    packet.data = {
      TeamID: 1
    };
    var results1 = controller.removeFromTeam(packet, {}, app);
    return results1.should.eventually.be.rejected.and.have.property('Description').that.equal('Invalid Parameters');
  });

  it('removeFromTeam() should return failure for invalid UserID parameter.', function() {
    packet.data = {
      TeamID: 1,
      UserID: -1
    };
    var results1 = controller.removeFromTeam(packet, {}, app);
    return results1.should.eventually.be.rejected.and.have.property('Description').that.equal('Invalid Parameters');
  });

  it('removeFromTeam() should return failure for team not beloging to current user.', function() {
    packet.data = {
      TeamID: 3,
      UserID: 1
    };
    var results1 = controller.removeFromTeam(packet, {}, app);
    return results1.should.eventually.be.rejected.and.have.property('Description').that.equal('You are not the manager of this team.');
  });

  it('removeFromTeam() should return failure for inexistant team', function() {
    packet.data = {
      TeamID: 99999,
      UserID: 1
    };
    var results1 = controller.removeFromTeam(packet, {}, app);
    return results1.should.eventually.be.rejected.and.have.property('Description').that.equal('Team no longer exists!');
  });

  it('removeFromTeam() should return Success for valid data', function() {
    packet.userID = 5;
    packet.data = {
      TeamID: 5,
      UserID: 20
    };

    var results1 = controller.removeFromTeam(packet, {}, app);

    return results1.should.eventually.be.fulfilled.then(function(){
      return knex('team_players')
        .select()
        .where('team_id', packet.data.TeamID)
        .where('user_id', packet.data.UserID)
        .first()
        .then(function(teamPlayer){
          expect(teamPlayer).to.be.an('undefined');
        });
    });
  });






  /*
   * leaveTeam
   */

  it('leaveTeam() should return failure for missing TeamID parameter.', function() {
    packet.data = {

    };
    var results1 = controller.leaveTeam(packet, {}, app);
    return results1.should.eventually.be.rejected.and.have.property('Description').that.equal('Invalid Parameters');
  });

  it('leaveTeam() should return failure for invalid TeamID parameter.', function() {
    packet.data = {
      TeamID: -1
    };
    var results1 = controller.leaveTeam(packet, {}, app);
    return results1.should.eventually.be.rejected.and.have.property('Description').that.equal('Invalid Parameters');
  });

  it('leaveTeam() should return failure for inexistant team', function() {
    packet.data = {
      TeamID: 99999
    };
    var results1 = controller.leaveTeam(packet, {}, app);
    return results1.should.eventually.be.rejected.and.have.property('Description').that.equal('Team no longer exists!');
  });

  it('leaveTeam() should return Success for valid data', function() {
    packet.userID = 25;
    packet.data = {
      TeamID: 5
    };

    var results1 = controller.leaveTeam(packet, {}, app);

    return results1.should.eventually.be.fulfilled.then(function(){
      return knex('team_players')
        .select()
        .where('team_id', packet.data.TeamID)
        .where('user_id', packet.userID)
        .first()
        .then(function(teamPlayer){
          expect(teamPlayer).to.be.an('undefined');
        });
    });
  });


  /*
   * getTeam
   */

  it('getTeam() should return failure for invalid team.', function() {
    packet.data = {
      TeamID: 0
    };
    var results1 = controller.getTeam(packet, {}, app);
    return results1.should.eventually.be.rejected.and.have.property('Description').that.equal('Invalid Parameters');
  });

  it('getTeam() should return failure for non existant team.', function() {

    packet.data = {
      TeamID: 99999
    };

    var results = controller.getTeam(packet, {}, app);

    return results.should.eventually.be.rejected
      .and.have.property('Description')
      .that.equal('Team no longer exists!');
  });

  it('getTeam() should return Success for valid team id.', function() {

    packet.data = {
      TeamID: 4
    };

    var results = controller.getTeam(packet, {}, app);

    return Promise.all([

      results.should.eventually.be.fulfilled
        .and.have.property('Team')
        .that.have.property('TeamID')
        .that.equal(packet.data.TeamID),

      results.should.eventually.be.fulfilled
        .and.have.property('Team')
        .that.have.property('TeamName')
        .that.equal('Chelsea'),

      results.should.eventually.be.fulfilled
        .and.have.property('Team')
        .that.have.property('Players')
        .that.have.lengthOf(17),

    ]);

  });


  /*
   * respondToTeamInvite
   */

  it('respondToTeamInvite() should return failure for invalid team.', function() {
    packet.data = {
      TeamID: 0
    };
    var results1 = controller.respondToTeamInvite(packet, {}, app);
    return results1.should.eventually.be.rejected.and.have.property('Description').that.equal('Invalid Parameters');
  });

  it('respondToTeamInvite() should return failure for missing response parameter.', function() {
    packet.data = {
      TeamID: 3
    };
    var results1 = controller.respondToTeamInvite(packet, {}, app);
    return results1.should.eventually.be.rejected.and.have.property('Description').that.equal('Invalid Parameters');
  });

  it('respondToTeamInvite() should return failure for non existant team.', function() {
    packet.userID = 25;
    packet.data = {
      TeamID: 99999,
      Response: 1
    };
    var results1 = controller.respondToTeamInvite(packet, {}, app);
    return results1.should.eventually.be.rejected.and.have.property('Description').that.equal('Team no longer exists!');
  });

  it('respondToTeamInvite() should return failure for missing team invite.', function() {
    packet.userID = 25;
    packet.data = {
      TeamID: 1,
      Response: 1
    };
    var results1 = controller.respondToTeamInvite(packet, {}, app);
    return results1.should.eventually.be.rejected.and.have.property('Description').that.equal('Cannot find team invite.');
  });

  it('respondToTeamInvite() should return failure for missing team invite.', function() {
    packet.userID = 25;
    packet.data = {
      TeamID: 1,
      Response: 1
    };
    var results1 = controller.respondToTeamInvite(packet, {}, app);
    return results1.should.eventually.be.rejected.and.have.property('Description').that.equal('Cannot find team invite.');
  });

  it('respondToTeamInvite() should return Success for valid team invite.', function() {
    packet.userID = 25;
    packet.data = {
      TeamID: 3,
      Response: 1
    };
    var results1 = controller.respondToTeamInvite(packet, {}, app);
    return results1.should.eventually.be.fulfilled;//.and.have.property('Description').that.equal('Cannot find team invite.');
  });

  it('respondToTeamInvite() should return Success for valid team invite.', function() {
    packet.userID = 25;
    packet.data = {
      TeamID: 4,
      Response: 0
    };
    var results1 = controller.respondToTeamInvite(packet, {}, app);
    return results1.should.eventually.be.fulfilled;//.and.have.property('Description').that.equal('Cannot find team invite.');
  });

  it('changeTeamPlayerPositions() shoud return Success for valid parameters', function(){
    packet.userID = 26;
    packet.data = {
      TeamID: 7,
      Positions: [
        {PositionID: 0,  UserID: 26, },
        {PositionID: 1,  UserID: 27, },
        {PositionID: 2,  UserID: 28, },
        {PositionID: 3,  UserID: 29, },
        {PositionID: 4,  UserID: 30, },
        {PositionID: 5,  UserID: 31, },
        {PositionID: 6,  UserID: 32, },
        {PositionID: 7,  UserID: 33, },
        {PositionID: 8,  UserID: 34, },
        {PositionID: 9,  UserID: 35, },
        {PositionID: 10, UserID: 36, },
        {PositionID: 11, UserID: 37, },
        {PositionID: 12, UserID: 38, },
        {PositionID: 13, UserID: 39, },
        {PositionID: 14, UserID: 40, },
        {PositionID: 15, UserID: 41, },
        {PositionID: 16, UserID: 42, },
        {PositionID: 17, UserID: 43, },
        {PositionID: 18, UserID: 44, },
        {PositionID: 19, UserID: 45  },
        {PositionID: 20, UserID: 46, },
        {PositionID: 21, UserID: 47, },
        {PositionID: 22, UserID: 48, },
        {PositionID: 23, UserID: 49, },
        {PositionID: 24, UserID: 50, },
        {PositionID: 25, UserID: 51, },
        {PositionID: 26, UserID: 52, },
        {PositionID: 27, UserID: 53, },
        {PositionID: 28, UserID: 54, },
        {PositionID: 29, UserID: 55, },
        {PositionID: 30, UserID: 56, },
        {PositionID: 31, UserID: 57, },
        {PositionID: 32, UserID: 58, },
      ],
    };
    var results1 = controller.changeTeamPlayerPositions(packet, {}, app);
    return results1.should.eventually.be.fulfilled;
  });

  it('followTeam() should return Success for valid data.', function() {
    packet.userID = 25;
    packet.data = {
      TeamID: 4
    };
    var results1 = controller.followTeam(packet, {}, app);
    return results1.should.eventually.be.fulfilled;//.and.have.property('Description').that.equal('Cannot find team invite.');
  });

  it('followTeam() should return Success for valid data.', function() {
    packet.userID = 25;
    packet.data = {
      TeamID: 4
    };
    var results1 = controller.followTeam(packet, {}, app);
    return results1.should.eventually.be.fulfilled;//.and.have.property('Description').that.equal('Cannot find team invite.');
  });


  it('followTeam() should return Success for valid data.', function() {
    packet.userID = 26;
    packet.data = {
      TeamID: 4
    };
    var results1 = controller.followTeam(packet, {}, app);
    return results1.should.eventually.be.fulfilled;//.and.have.property('Description').that.equal('Cannot find team invite.');
  });

  it('unfollowTeam() should return Success for valid data.', function() {
    packet.userID = 25;
    packet.data = {
      TeamID: 4
    };
    var results1 = controller.unfollowTeam(packet, {}, app);
    return results1.should.eventually.be.fulfilled;//.and.have.property('Description').that.equal('Cannot find team invite.');
  });


  it('getFollowers() should return error when missing team id', function() {
    packet.userID = 25;
    packet.data = {};
    var results1 = controller.getFollowers(packet, {}, app);
    return results1.should.eventually.be.rejected.and.have.property('Description').that.equal('Invalid Parameters');
  });


  it('getFollowers() should return error when invalid team id', function() {
    packet.userID = 25;
    packet.data = {
      TeamID: -1
    };

    var results1 = controller.getFollowers(packet, {}, app);
    return results1.should.eventually.be.rejected.and.have.property('Description').that.equal('Invalid Parameters');
  });

  it('getFollowers() should return error when non existant team id', function() {
    packet.userID = 25;
    packet.data = {
      TeamID: 999999
    };

    var results1 = controller.getFollowers(packet, {}, app);
    return results1.should.eventually.be.rejected.and.have.property('Description').that.equal('Team no longer exists!');
  });

  it('getFollowers() should return success for a valid team id', function() {
    packet.userID = 25;
    packet.data = {
      TeamID: 1
    };

    var results = controller.getFollowers(packet, {}, app);

    return results.should.eventually.be.fulfilled.then(function(response){
        response.should.have.property('Success').that.equals(0);
        response.should.have.property('Followers').that.is.an('array');
    });

  });

  it('updateTeam() should return Success for valid team (1).', function() {
    packet.userID = 1;
    packet.data = {
      TeamID: 1,
      Lat: 10,
      Lon: -2,
    };

    var results = controller.updateTeam(packet, {}, app);

    return Promise.all([
      results.should.eventually.be.fulfilled
    ]).then(function(values) {
      return knex('teams').select().where('id', packet.data.TeamID).first().then(function(team){
        team.lat.should.equal(packet.data.Lat);
        team.lon.should.equal(packet.data.Lon);
      });
    });

  });

  it('updateTeam() should return Success for valid team (2).', function() {
    packet.userID = 1;
    packet.data = {
      TeamID: 1,
      Picture: config.baseUrl + "UserUploads/09NvyEQlURSalNKlpxCMBuEf7vUer5lWDuRH2uUF.jpg"
    };

    var results = controller.updateTeam(packet, {}, app);

    return Promise.all([
      results.should.eventually.be.fulfilled
    ]).then(function(values) {
      return knex('teams').select().where('id', packet.data.TeamID).first().then(function(team){
        team.picture.should.equal(packet.data.PictureURL);
      });
    });

  });

  it('updateTeam() should return Success for valid team (3).', function() {
    packet.userID = 1;
    packet.data = {
      TeamID: 1,
      CoverPicture: config.baseUrl + "UserUploads/09NvyEQlURSalNKlpxCMBuEf7vUer5lWDuRH2uUF.jpg"
    };

    var results = controller.updateTeam(packet, {}, app);

    return Promise.all([
      results.should.eventually.be.fulfilled
    ]).then(function(values) {
      return knex('teams').select().where('id', packet.data.TeamID).first().then(function(team){
        team.cover_picture.should.equal(packet.data.CoverPictureURL);
      });
    });

  });

  it('updateTeam() should return Success for valid team (4).', function() {
    packet.userID = 1;
    packet.data = {
      TeamID: 1,
      TeamName: "TeamName Up"
    };

    var results = controller.updateTeam(packet, {}, app);

    return Promise.all([
      results.should.eventually.be.fulfilled
    ]).then(function(values) {
      return knex('teams').select().where('id', packet.data.TeamID).first().then(function(team){
        team.name.should.equal(packet.data.TeamName);
      });
    });

  });

  it('getLastUpdatedTeam() should return Success for valid data.', function() {
    packet.userID = 3;
    var results1 = controller.getLastUpdatedTeam(packet, {}, app);
    return results1.should.eventually.be.fulfilled;//.and.have.property('Description').that.equal('Cannot find team invite.');
  });

  it('deleteTeam() should return Success for valid data.', function() {
    packet.userID = 3;
    var results1 = controller.getLastUpdatedTeam(packet, {}, app);
    return results1.should.eventually.be.fulfilled;//.and.have.property('Description').that.equal('Cannot find team invite.');
  });

  it('deleteTeam() should return Success for valid data.', function() {
    packet.userID = 1;
    packet.data = {
      TeamID: 29
    };

    var results1 = controller.deleteTeam(packet, {}, app);
    return results1.should.eventually.be.fulfilled.and.have.property('Success').that.equal(0);
  });

  it('deleteTeam() should return Error for invalid data.', function() {
    packet.userID = 1;
    packet.data = {
      TeamID: 29
    };

    var results1 = controller.deleteTeam(packet, {}, app);
    return results1.should.eventually.be.rejected.and.have.property('Success').that.equal(2);
  });

  it('deleteTeam() should return Error for invalid data.', function() {
    packet.userID = 3;
    packet.data = {
      TeamID: 28
    };

    var results1 = controller.deleteTeam(packet, {}, app);
    return results1.should.eventually.be.rejected.and.have.property('Success').that.equal(3);
  });

  it('checkUserRightToDeleteTeam() should return Error for invalid params.', function() {
    packet.userID = 3;
    packet.data = {};

    var results1 = controller.checkUserRightToDeleteTeam(packet, {}, app);
    return results1.should.eventually.be.rejected.and.have.property('Success').that.equal(1);
  });

  it('checkUserRightToDeleteTeam() should return Error for invalid data - team no longer exist.', function() {
    packet.userID = 1;
    packet.data = {
      TeamID: 29
    };

    var results1 = controller.checkUserRightToDeleteTeam(packet, {}, app);
    return results1.should.eventually.be.rejected.and.have.property('Success').that.equal(2);
  });

  it('checkUserRightToDeleteTeam() should return Success for invalid data - User has no right to delete team', function() {
    packet.userID = 3;
    packet.data = {
      TeamID: 28
    };

    var results1 = controller.checkUserRightToDeleteTeam(packet, {}, app);
    return results1.should.eventually.be.rejected.and.have.property('Success').that.equal(3);
  });

  it('checkUserRightToDeleteTeam() should return Success for valid data.', function() {
    packet.userID = 1;
    packet.data = {
      TeamID: 31
    };

    var results1 = controller.checkUserRightToDeleteTeam(packet, {}, app);
    return results1.should.eventually.be.fulfilled.and.have.property('Success').that.equal(0);
  });
});

