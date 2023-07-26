var GetJoinedGamesController =
    require('controllers/get-joined-games-controller');

describe('GetJoinedGamesController', function() {
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
           var results = GetJoinedGamesController.getJoinedGames(packet);
           return expect(results).to.eventually.deep.equal
               .expectedResultsEmpty;
       });
    it('Should return no results when userID does not exist for ' +
       'some reason', function() {
           packet = {
               userID: 123123123,
               data: {}
           };
           var results = GetJoinedGamesController.getJoinedGames(packet);
           return expect(results).to.eventually.deep.equal
               .expectedResultsEmpty;
       });
    it('Should return list of games for the right user', function() {
        packet = {
            userID: 2,
            data: {}
        };
        var results = GetJoinedGamesController.getJoinedGames(packet);
        return Promise.all([
            expect(results)
                .to.eventually.have.property('Success', 0),
            expect(results)
                .to.eventually.have.property('Description', null),
            expect(results)
                .to.eventually.have.property('Games')
                .that.has.lengthOf(2)
        ]);
    });
});
