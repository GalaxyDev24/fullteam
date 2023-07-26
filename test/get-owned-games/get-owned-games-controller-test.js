var GetOwnedGamesController =
    require('controllers/get-owned-games-controller');

describe('GetOwnedGamesController', function() {
    var expectedResultsEmpty = {
        Success: 0,
        Description: null,
        Games: []
    }
    it('Should return no results when a user does not own a game',
       function() {
           packet = {
               userID: 1,
               data: {}
           };
           var results = GetOwnedGamesController.getOwnedGames(packet);
           return expect(results).to.eventually.deep.equal
               .expectedResultsEmpty;
       });
    it('Should return no results when userID does not exist for ' +
       'some reason', function() {
           packet = {
               userID: 123123123,
               data: {}
           };
           var results = GetOwnedGamesController.getOwnedGames(packet);
           return expect(results).to.eventually.deep.equal
               .expectedResultsEmpty;
       });
    it('Should return list of games for the right user', function() {
        packet = {
            userID: 2,
            data: {}
        };
        var results = GetOwnedGamesController.getOwnedGames(packet);
        return Promise.all([
            expect(results)
                .to.eventually.have.property('Success', 0),
            expect(results)
                .to.eventually.have.property('Description', null),
            expect(results)
                .to.eventually.have.property('Games')
                .that.has.lengthOf(6)
        ]);
    });
});
