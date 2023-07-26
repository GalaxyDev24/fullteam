var RespondToGameApplicationController =
    require('controllers/respond-to-game-application-controller');

describe('RespondToGameApplicationController', function() {
  it('should return error when no params given', function() {
    packet = {
      data: {},
      userID: 1
    };
    var results = RespondToGameApplicationController
        .respondToGameApplication(packet);
    return expect(results).to.eventually.be.rejected
      .then(function(error) {
        expect(error).to.have.property('Description',
                                       'Invalid Parameters');
        expect(error).to.have.property('Success', 1);
      });
  });
  it('should return error when no game exists', function() {
    packet = {
      data: {GameID: 123123123, UserID: 1, Response: 1},
      userID: 2
    };
    var results = RespondToGameApplicationController
        .respondToGameApplication(packet);
    return expect(results).to.eventually.be.rejected
      .then(function(error) {
        expect(error).to.have.property('Description',
                                       "Game doesn't exist");
        expect(error).to.have.property('Success', 10);
      });
  });
  it('should return error when no application exists', function() {
    packet = {
      data: {GameID: 1, UserID: 123123, Response: 1},
      userID: 2
    };
    var results = RespondToGameApplicationController
        .respondToGameApplication(packet);
    return expect(results).to.eventually.be.rejected
      .then(function(error) {
        expect(error).to.have.property('Description',
                                       "Application doesn't exist");
        expect(error).to.have.property('Success', 1);
      });
  });
  it('should return error when you aren\'t the owner', function() {
    packet = {
      data: {GameID: 1, UserID: 3, Response: 1},
      userID: 1
    };
    var results = RespondToGameApplicationController
        .respondToGameApplication(packet);
    return expect(results).to.eventually.be.rejected
      .then(function(error) {
        expect(error).to.have.property('Description',
                                       "You are not the owner");
        expect(error).to.have.property('Success', 1);
      });
  });
  it('should return Success when all params are fine', function() {
    packet = {
      data: {GameID: 1, UserID: 3, Response: 1},
      userID: 2
    };
    var results = RespondToGameApplicationController
        .respondToGameApplication(packet);
    return Promise.all([
      expect(results).to.eventually.have.property('Success', 0),
      expect(results).to.eventually.have.property('Description', null),
    ]);
  });

});

