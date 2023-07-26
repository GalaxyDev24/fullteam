var GetAssociatedGamesController =
  require('controllers/get-associated-games-controller');

describe('GetAssociatedGamesController', function() {
  var expectedResultsEmpty = {
    Success: 0,
    Description: null,
    Games: []
  }
  it('Should return no results when a user does not own a game, and is not'
    + 'playing in any games.',
    function() {
      packet = {
        userID: 4,
        data: {}
      };
      var results = GetAssociatedGamesController.getAssociatedGames(packet);
      return expect(results).to.eventually.deep.equal
        .expectedResultsEmpty;
    });
  it('Should return no results when userID does not exist for ' +
    'some reason', function() {
      packet = {
        userID: 123123123,
        data: {}
      };
      var results = GetAssociatedGamesController.getAssociatedGames(packet);
      return expect(results).to.eventually.deep.equal
        .expectedResultsEmpty;
    });
  it('Should return games if the user is playing in a game or owns one', function() {
    packet = {
      userID: 2,
      data: {}
    };
    var results = GetAssociatedGamesController.getAssociatedGames(packet);
    return Promise.all([
      expect(results)
      .to.eventually.have.property('Success', 0),
      expect(results)
      .to.eventually.have.property('Description', null),
      expect(results)
      .to.eventually.have.property('Games')
    ]);
  });
  it('Should not return duplicate games if a use is playing in a game they own', function() {
    packet = {
      userID: 2,
      data: {}
    };
    return GetAssociatedGamesController.getAssociatedGames(packet)
      .then(function(res) {
        for (var ii = 0; ii < res.length; ++ii) {
          for (var jj = 0; jj < res.length; ++jj) {
            if (ii == jj) { continue; }
            if (res[ii].GameID == res[jj].GameID) {
              return false;
            }
          }
        }
        return true;
      }).should.eventually.be.equal(true);
  });
});
