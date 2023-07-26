var knex = require('lib/knex'),
    q = require('q');

var GetRegionalRankingsController = require('controllers/get-regional-rankings-controller');

describe('GetRegionalRankingsController', function() {

    var packet = {
        userID: 1,
        data: {}    
    };

    it('should return failure for no params given to getRankings()', function() {
        var results = GetRegionalRankingsController.getRankings(packet);
        return results.should.eventually.be.rejected;
    });

    it('should return failure if user does not exist', function() {
        packet.data = {
            UserID: -1
        };

        var results = GetRegionalRankingsController.getRankings(packet);
        return results.should.eventually.be.rejected;

    });

    it('should return valid results if user exists', function() {

        packet.data = {
            UserID: 18
        };

        var results1 = GetRegionalRankingsController.getRankings(packet);
        
        packet.data = {
            UserID: 21
        };
        
        var results2 = GetRegionalRankingsController.getRankings(packet);

        return Promise.all([
            results1.should.be.fulfilled,
            results2.should.be.fulfilled,
        ]);

    });

});