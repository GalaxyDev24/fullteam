var SearchController = require('controllers/search-controller');

describe('SearchController', function() {

    it('Should return failure for missing parameters', function() {
        var packet = {
            userID: 1,
            data: {

            }
        };

        var results = SearchController.globalSearch(packet);
        return expect(results).to.eventually.be.rejected;

    });

    it('Should return failure for missing Type parameters', function() {
        var packet = {
            userID: 1,
            data: {
              Term: 'umar'
            }
        };

        var results = SearchController.globalSearch(packet);
        return expect(results).to.eventually.be.rejected;

    });

    it('Should return failure for missing Term parameters', function() {
        var packet = {
            userID: 1,
            data: {
              Type: 'player'
            }
        };

        var results = SearchController.globalSearch(packet);
        return expect(results).to.eventually.be.rejected;

    });

    it('Should return success for correct parameters', function() {
        var packet = {
            userID: 1,
            data: {
              Term: 'umar',
              Type: 'all',
            }
        };

        var results = SearchController.globalSearch(packet);
        return expect(results).to.eventually.be.fulfilled;

    });

});
