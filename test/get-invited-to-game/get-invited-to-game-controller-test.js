var GetInvitedToGameController =
    require('controllers/get-invited-to-game-controller');

describe('GetInvitedToGameController', function() {
    it('Should return error on no params given', function() {
        var packet = {
            userID: 1,
            data: {}
        };
        var results = GetInvitedToGameController.getInvitedToGame(packet);
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
            userID: 1
        };
        var results = GetInvitedToGameController
            .getInvitedToGame(packet);
        return expect(results).to.eventually.be.rejected
            .then(function(error) {
                expect(error).to.have.property('Description',
                                               "No game exists");
                expect(error).to.have.property('Success', 10);
            });
    });
    it('should return error when you are not the owner', function() {
        packet = {
            data: {GameID: 1},
            userID: 1
        };
        var results = GetInvitedToGameController
            .getInvitedToGame(packet);
        return expect(results).to.eventually.be.rejected
            .then(function(error) {
                expect(error).to.have.property('Description',
                                               "You must be the owner of the game");
                expect(error).to.have.property('Success', 2);
            });
    });
    it('should return an empty list when there are no invites', function() {
        packet = {
            data: {GameID: 2},
            userID: 2
        };
        var results = GetInvitedToGameController
            .getInvitedToGame(packet);
        return Promise.all([
            expect(results).to.eventually.have.property('Success', 0),
            expect(results).to.eventually.have.property('Description', null),
            expect(results).to.eventually.have.property('InviteList').that.has.lengthOf(0),
        ]);
    });
    it('should return a list with items in it when everything is right', function() {
        packet = {
            data: {GameID: 1},
            userID: 2
        };
        var results = GetInvitedToGameController
            .getInvitedToGame(packet);
        return Promise.all([
            expect(results).to.eventually.have.property('Success', 0),
            expect(results).to.eventually.have.property('Description', null),
            expect(results).to.eventually.have.property('InviteList').that.has.lengthOf(1),
        ]);
    });
});


