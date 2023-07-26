var ApplyForGameController = require('controllers/apply-for-game-controller');

describe('ApplyForGameController', function() {
    it('Should return invalid params err for no params given', function() {
        var packet = {
            userID: 1,
            data: {}
        };
        var results = ApplyForGameController.applyForGame(packet);
        return expect(results).to.eventually.be.rejected
            .then(function(error) {
                expect(error).to.have.property('Description',
                                               'Invalid Parameters');
                expect(error).to.have.property('Success', 1);
            });
    });
    it('Should return failure for a game which you are already playing in', function() {
        var packet = {
            userID: 2,
            data: {GameID: 1}
        };
        var results = ApplyForGameController.applyForGame(packet);
        return expect(results).to.eventually.be.rejected
            .then(function(error) {
                expect(error).to.have.property('Description',
                                               'Already playing');
                expect(error).to.have.property('Success', 4);
            });
    });
    it('Should return failure for a game which you have already applied to', function() {
        var packet = {
            userID: 3,
            data: {GameID: 1}
        };
        var results = ApplyForGameController.applyForGame(packet);
        return expect(results).to.eventually.be.rejected
            .then(function(error) {
                expect(error).to.have.property('Description',
                                               'Already applied');
                expect(error).to.have.property('Success', 3);
            });
    });
    it('Should return Successs when valid data is sent', function() {
        var packet = {
            userID: 1,
            data: {GameID: 1}
        };
        var results = ApplyForGameController.applyForGame(packet);
        return expect(results).to.eventually.have.property('Success', 0);
    });
});
