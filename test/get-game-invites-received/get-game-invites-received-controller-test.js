var GetGameInvitesReceivedController =
  require('controllers/get-game-invites-received-controller');

describe('GetGameInvitesReceivedController', function() {
  it('should return Success and a list of invites for the right user',
    function() {
      var packet = {
        userID: 1,
        data: {}
      };
      var results = GetGameInvitesReceivedController
        .getGameInvitesReceived(packet);
      results.then(function(result) {
        console.log(result.InviteList);
      });
      return Promise.all([
        expect(results).to.eventually.have.property('Success', 0),
        expect(results).to.eventually.have.property('Description', null),
        expect(results).to.eventually.have.property('InviteList')
        .that.has.lengthOf(1)
      ]);
    });
});
