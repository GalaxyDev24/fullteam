var GetGameAcceptedPlayersController =
    require('controllers/get-game-accepted-players-controller');

describe('GetGameAcceptedPlayersController', function() {
    it('Should return error for no params', function() {
        var packet = {
            userID: 1,
            data: {}
        };
        var results = GetGameAcceptedPlayersController
            .getGameAcceptedPlayers(packet);
        return expect(results).to.eventually.be.rejected
            .then(function(error) {
                expect(error).to.have.property('Description',
                                               'Invalid Parameters');
               expect(error).to.have.property('Success', 1);
            });
    });
    it('Should return an empty list for no accepted players', function() {
        var packet = {
            userID: 1,
            data: {GameID: 2}
        };
        var results = GetGameAcceptedPlayersController
            .getGameAcceptedPlayers(packet);
        var expectedResults = {
            Success: 0,
            Description: null,
            Players: []
        };
        return expect(results).to.eventually.deep.equal(expectedResults);
    });
    it('Should return a valid list for a game with players', function() {
        var packet = {
            userID: 1,
            data: {GameID: 1}
        };
        var results = GetGameAcceptedPlayersController
            .getGameAcceptedPlayers(packet);
        return Promise.all([
            expect(results)
                .to.eventually.have.property('Success', 0),
            expect(results)
                .to.eventually.have.property('Description', null),
            expect(results)
                .to.eventually.have.property('Players')
                .that.has.lengthOf(1)
        ]);
    });
});

