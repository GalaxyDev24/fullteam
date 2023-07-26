var GetGameInfoController = require('controllers/get-game-info-controller');

describe('GetGameInfoController', function() {
    it('should return error when no params given', function() {
        packet = {
            data: {},
            userID: 1
        };
        var results = GetGameInfoController.getGameInfo(packet);
        return expect(results).to.eventually.be.rejected
            .then(function(error) {
                expect(error).to.have.property('Description',
                                               'Invalid Parameters');
                expect(error).to.have.property('Success', 1);
            });
    });
    it('should return error when game doesn\'t exist', function() {
        packet = {
            data: {GameID: 123123123},
            userID: 1
        };
        var results = GetGameInfoController.getGameInfo(packet);
        return expect(results).to.eventually.be.rejected
            .then(function(error) {
                expect(error).to.have.property('Description',
                                               "Game doesn't exist");
                expect(error).to.have.property('Success', 10);
            });
    });
    it('should return game info when game exists', function() {
        packet = {
            data: {GameID: 1},
            userID: 1
        };
        var results = GetGameInfoController.getGameInfo(packet);
        return Promise.all([
            expect(results).to.eventually.have.property('Success', 0),
            expect(results).to.eventually.have.property('GameID', 1),
        ]);
    });
});
