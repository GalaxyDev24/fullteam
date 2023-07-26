var CreateGameController = require('controllers/create-game-controller');

describe('CreateGameController', function() {
  it('should return an error when invalid parameters are passed',
    function() {
      var packet = {
        userID: 1,
        data: {}
      };

      var results = CreateGameController.createGame(packet);

      var expectedResults = {
        Success: 1,
        Description: 'Invalid Parameters'
      };
      return expect(results).to.eventually.be.rejectedWith(expectedResults);
    });

  it("should return Success and the ID of the game when params are valid",
    function() {
      var packet = {
        userID: 1,
        data: {
          GameTitle: "ASD",
          Opponent: "The other team",
          GameTime: 0,
          Description: "asdDESC",
          IsCustomVenue: true,
          Venue: 'MyVenue',
          Lat: 0,
          Lon: 0,
          Public: true,
          Cost: 0,
        }
      };
      var results = CreateGameController.createGame(packet);

      return Promise.all([
        expect(results).to.eventually.have.property('Success').that.eventually.equals(0),
        expect(results).to.eventually.have.property('GameID')
      ]);
    });

  it("should return Success even when not all optional parameters are supplied",
    function() {
      var packet = {
        userID: 1,
        data: {
          GameTitle: "ASD",
          Opponent: "The other team",
          GameTime: 0,
          Description: "asdDESC",
          IsCustomVenue: true,
          Venue: 'MyVenue',
          Lat: 0,
          Lon: 0,
          Public: true,
          Cost: 0,
        }
      };
      var results = CreateGameController.createGame(packet);

      return Promise.all([
        expect(results).to.eventually.have.property('Success').that.eventually.equals(0),
        expect(results).to.eventually.have.property('GameID')
      ]);
    });
});

