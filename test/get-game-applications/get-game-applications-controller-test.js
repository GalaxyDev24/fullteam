var GetGameApplicationsController =
    require('controllers/get-game-applications-controller');

describe('GetGameApplicationsController', function() {
  it('Should return error when sending no parameters', function() {
    var packet = {
      userID: 1,
      data: {}
    };
    var results = GetGameApplicationsController
        .getGameApplications(packet);
    return expect(results).to.eventually.be.rejected
      .then(function(error) {
        expect(error).to.have.property('Description',
                                       'Invalid Parameters');
        expect(error).to.have.property('Success', 1);
      });
  });
  it('Should return an error when game ID does not exist', function() {
    var packet = {
      userID: 1,
      data: {GameID: 123456789}
    };
    var results = GetGameApplicationsController
        .getGameApplications(packet);
    return expect(results).to.eventually.be.rejected
      .then(function(error) {
        expect(error).to.have.property('Description',
                                       'No game exists');
        expect(error).to.have.property('Success', 10);
      });
  });
  it('Should return valid data when correct request is made', function() {
    var packet = {
      userID: 1,
      data: {GameID: 1}
    };
    var results = GetGameApplicationsController
        .getGameApplications(packet);
    var expectedResults = {
      Success: 0,
      Description: null,
      ApplicationsList: [
        {UserID: 1, Positions: [0]},
        {UserID: 3, Positions: [0]},
      ]
    };
    return expect(results).to.eventually.deep.equal(expectedResults).then(function() {
      console.log(results);
    });
  });
});
