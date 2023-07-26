var JoinTeamController = require('controllers/join-team-controller');

describe('JoinTeamController', function() {

    var packet = {
        userID: 1,
        data: {}    
    };

    it('should return failure for invalid params', function() {
        var results = JoinTeamController.joinTeam(packet);
        return results.should.eventually.be.rejected.
            and.should.eventually.have.property('Success', 1);
    });

    it('should return failure if team does not exist', function() {
        packet.data = {
            TeamID: 30,
            PositionID: 1
        };

        var results = JoinTeamController.joinTeam(packet);
        return results.should.eventually.be.rejected.
            and.should.eventually.have.property('Success', 2);

    });

    it('should return failure if user is not the manager of the team', function() {
        packet.data = {
            TeamID: 2,
            PositionID: 1
        };

        var results = JoinTeamController.joinTeam(packet);
        return results.should.eventually.be.rejected.
            and.should.eventually.have.property('Success', 3);

    });

    it('should return failure if user already joined team', function() {

        packet.data = {
            TeamID: 1,
            PositionID: 2
        };

        var results = JoinTeamController.joinTeam(packet);

        return results.should.eventually.be.rejected.
            and.should.eventually.have.property('Success', 4);

    });

    it('should return valid results with valid params', function() {

        packet.data = {
            TeamID: 18,
            PositionID: 2
        };

        var results = JoinTeamController.joinTeam(packet);

        return results.should.be.fulfilled.
            and.should.eventually.have.property('Success', 0);

    });

});