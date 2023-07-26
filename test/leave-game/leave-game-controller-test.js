var LeaveGameController = require('controllers/leave-game-controller');

describe('LeaveGameController', function() {
    it('should return error when no params given', function() {
        packet = {
            data: {},
            userID: 1
        };
        var results = LeaveGameController.leaveGame(packet);
        return expect(results).to.eventually.be.rejected
            .then(function(error) {
                expect(error).to.have.property('Description',
                                               'Invalid Parameters');
                expect(error).to.have.property('Success', 1);
            });
    });
    it('should return error when no game exists', function() {
        packet = {
            data: {GameID: 123123123},
            userID: 2
        };
        var results = LeaveGameController.leaveGame(packet);
        return expect(results).to.eventually.be.rejected
            .then(function(error) {
                expect(error).to.have.property('Description',
                                               "Game doesn't exist");
                expect(error).to.have.property('Success', 10);
            });
    });
    it('should return error when you aren\'t playing in the game', function() {
        packet = {
            data: {GameID: 2},
            userID: 2
        };
        var results = LeaveGameController.leaveGame(packet);
        return expect(results).to.eventually.be.rejected
            .then(function(error) {
                expect(error).to.have.property('Description',
                                               "You are not in this game");
                expect(error).to.have.property('Success', 1);
            });
    });
    it('should return Success when all params are correct', function() {
        packet = {
            data: {GameID: 1},
            userID: 2
        };
        var results = LeaveGameController
            .leaveGame(packet);
        return Promise.all([
            expect(results).to.eventually.have.property('Success', 0),
            expect(results).to.eventually.have.property('Description', null),
        ]);
    });
})

