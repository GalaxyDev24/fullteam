var ChangeTeamPictureController = require('controllers/change-team-picture-controller');

var img = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0"
    + "NAAAAKElEQVQ4jWNgYGD4Twzu6FhFFGYYNXDUwGFpIAk2E4dHDRw1cDgaCAASFOffhEIO"
    + "3gAAAABJRU5ErkJggg==";

describe('ChangeTeamPictureController', function() {
  it('should return error for no params given', function() {
    var packet = {
      userID: 1,
      data: {}
    }
    var results = ChangeTeamPictureController.changeTeamPicture(packet, null, null);
    return results.should.eventually.be.rejected.and.have.property('Success', 1);
  });
  it('should return error for not being the owner', function() {
    var packet = {
      userID: 1,
      data: {TeamID: 2, Picture: img}
    }
    var results = ChangeTeamPictureController.changeTeamPicture(packet, null, null);
    return results.should.eventually.be.rejected.and.have.property('Success', 2);
  });
  it('should return success for valid params', function() {
    var packet = {
      userID: 4,
      data: {TeamID: 4, Picture: img}
    }
    var results = ChangeTeamPictureController.changeTeamPicture(packet, null, null);
    return results.should.eventually.be.fulfilled.and.have.property('Success', 0);
  });
});
