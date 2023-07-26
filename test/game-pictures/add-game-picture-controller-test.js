var AddGamePictureController = require('controllers/add-game-picture-controller');

var img = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0"
    + "NAAAAKElEQVQ4jWNgYGD4Twzu6FhFFGYYNXDUwGFpIAk2E4dHDRw1cDgaCAASFOffhEIO"
    + "3gAAAABJRU5ErkJggg==";

describe("AddGamePictureController", function() {
  it('should return error for no params given', function() {
    var params = {
      userID: 1,
      data: {}
    };
    var results = AddGamePictureController.addGamePicture(params);
    return results.should.eventually.be.rejected.and.eventually.have.property('Success', 1);
  });
  it('should return error for not being the owner', function() {
    var params = {
      userID: 1,
      data: {GameID: 1, Picture: img}
    };
    var results = AddGamePictureController.addGamePicture(params);
    return results.should.eventually.be.rejected.and.eventually.have.property('Success', 2);
  });
  it('should return success for valid params', function() {
    var params = {
      userID: 2,
      data: {GameID: 1, Picture: img}
    };
    var results = AddGamePictureController.addGamePicture(params);
    return results.should.eventually.be.fulfilled.and.eventually.have.property('Success', 0);
  });
});
