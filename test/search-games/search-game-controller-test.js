var SearchGameController = require('controllers/search-game-controller');

describe('SearchGameController', function() {
    it('Should return error when no search distance provided', function() {
        var packet = {
            userID: 1,
            data: {}
        };
        var results = SearchGameController.searchGames(packet);
        return results.should.eventually.be.rejected;
    });
    it('Should return error when search distance < 0', function() {
        var packet = {
            userID: 1,
            data: {SearchDistance: -1}
        };
        var results = SearchGameController.searchGames(packet);
        return results.should.eventually.be.rejected;
    });
    it('Should return valid results when search distance is big enough ' +
       'and games are available', function() {  
           var packet = {
               userID: 1,
               data: {SearchDistance: 10000}
           };
           var results = SearchGameController.searchGames(packet);
           return results.should.eventually.have.property('Games')
               .that.has.length.above(0);
       });
});
