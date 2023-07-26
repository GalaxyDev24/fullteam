var RespondToGameInviteController = require('controllers/respond-to-game-invite-controller');

describe('RespondToGameInviteController', function() {
  it('should return error when no params given', function() {
    packet = {
      data: {},
      userID: 1
    };
    var results = RespondToGameInviteController
        .respondToGameInvite(packet);
    return expect(results).to.eventually.be.rejected
      .then(function(error) {
        expect(error).to.have.property('Description',
                                       'Invalid Parameters');
        expect(error).to.have.property('Success', 1);
      });
  });
  it('should return error when no game exists', function() {
    packet = {
      data: {GameID: 123123123321, Response: 1},
      userID: 1
    };
    var results = RespondToGameInviteController
        .respondToGameInvite(packet);
    return expect(results).to.eventually.be.rejected
      .then(function(error) {
        expect(error).to.have.property('Description',
                                       "Game doesn't exist");
        expect(error).to.have.property('Success', 10);
      });
  });
  it('should return error when no invite exists', function() {
    packet = {
      data: {GameID: 1, Response: 1},
      userID: 3
    };
    var results = RespondToGameInviteController
        .respondToGameInvite(packet);
    return expect(results).to.eventually.be.rejected
      .then(function(error) {
        expect(error).to.have.property('Description',
                                       "No invite exists");
        expect(error).to.have.property('Success', 1);
      });
  });
  it('should return Success when all params are fine', function() {
    packet = {
      data: {GameID: 1, Response: 1},
      userID: 1
    };
    var results = RespondToGameInviteController
        .respondToGameInvite(packet);
    return Promise.all([
      results.should.eventually.be.fulfilled,
      expect(results).to.eventually.have.property('Success', 0),
      expect(results).to.eventually.have.property('Description', null),
    ]);
  });
  it('should return Success when the owner is responding', function() {
    packet = {
      data: {GameID: 2, Response: 1},
      userID: 2
    };
    var results = RespondToGameInviteController
        .respondToGameInvite(packet);
    return Promise.all([
      results.should.eventually.be.fulfilled,
      expect(results).to.eventually.have.property('Success', 0),
      expect(results).to.eventually.have.property('Description', null),
    ]);
  });
});
