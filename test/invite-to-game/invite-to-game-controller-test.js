var InviteToGameController =
    require('controllers/invite-to-game-controller');

describe('InviteToGameController', function() {
    it('should return error when no params given', function() {
        var packet = {
            userID: 1,
            data: {}
        };
        var results = InviteToGameController.inviteToGame(packet);
        return expect(results).to.eventually.be.rejected
            .then(function(error) {
                expect(error).to.have.property('Description',
                                               'Invalid Parameters');
                expect(error).to.have.property('Success', 1);
            });
    });
    it('should return error if you aren\'t the owner', function() {
        var packet = {
            userID: 1,
            data: {GameID: 1, UserIDs: [2]}
        };
        var results = InviteToGameController.inviteToGame(packet);
        return expect(results).to.eventually.be.rejected
            .then(function(error) {
                expect(error).to.have.property('Description',
                                               'Must be game owner');
                expect(error).to.have.property('Success', 2);
            });
    });
    it('should return error if game doesn\'t exist', function() {
        var packet = {
            userID: 1,
            data: {GameID: 123123, UserIDs: [2]}
        };
        var results = InviteToGameController.inviteToGame(packet);
        return expect(results).to.eventually.be.rejected
            .then(function(error) {
                expect(error).to.have.property('Description',
                                               'Game doesn\'t exist');
                expect(error).to.have.property('Success', 10);
            });
    });
    it('should return error if you\'re inviting yourself', function() {
        var packet = {
            userID: 2,
            data: {GameID: 1, UserIDs: [2]}
        };
        var results = InviteToGameController.inviteToGame(packet);
        return expect(results).to.eventually.be.rejected
            .then(function(error) {
                expect(error).to.have.property('Description',
                                               'Can\'t invite yourself');
                expect(error).to.have.property('Success', 3);
            });
    });
    it('should return Success if params are valid', function() {
        var packet = {
            userID: 2,
            data: {GameID: 1, UserIDs: [3]}
        };
        var results = InviteToGameController.inviteToGame(packet);
        return Promise.all([
            expect(results).to.eventually.have.property('Success', 0),
            expect(results).to.eventually.have.property('Description', null)
        ]);
    });

    it('should return Success if params are valid (more than one user id) ', function() {
        var packet = {
            userID: 2,
            data: {"GameID":1,"UserIDs":[1,3]}
        };
        var results = InviteToGameController.inviteToGame(packet);
        return Promise.all([
            expect(results).to.eventually.have.property('Success', 0),
            expect(results).to.eventually.have.property('Description', null)
        ]);
    });
});
