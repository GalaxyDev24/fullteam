var GetTeamRegionalRankingsController = require('controllers/get-team-regional-rankings-controller');

describe('GetTeamRegionalRankingsController', function() {

    var packet = {
        userID: 1,
        data: {}    
    };

    it('should return failure for no params given to getTeamRankings()', function() {
        var results = GetTeamRegionalRankingsController.getTeamRankings(packet);
        return results.should.eventually.be.rejected.
      and.should.eventually.have.property('Success', 1);
    });

    it('should return failure if team does not exist', function() {
        packet.data = {
            TeamID: -1
        };

        var results = GetTeamRegionalRankingsController.getTeamRankings(packet);
        return results.should.eventually.be.rejected;

    });

    it('should return valid results if team exists', function() {

        packet.data = {
            TeamID: 18
        };

        var results1 = GetTeamRegionalRankingsController.getTeamRankings(packet);
        
        packet.data = {
            TeamID: 21
        };
        
        var results2 = GetTeamRegionalRankingsController.getTeamRankings(packet);

        return Promise.all([
            results1.should.be.fulfilled,
            results2.should.be.fulfilled,
        ]);

    });

});