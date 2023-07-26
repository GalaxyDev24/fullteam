var knex = require('lib/knex'),
    q = require('q'),
    config = require('config')
    ;

var GetProfileController = require('controllers/get-profile-controller');

describe('GetProfileController', function() {

  var packet = {
    userID: 1,
    data: {}    
  };

  it('should return failure for no params given to getProfile()', function() {
    var results = GetProfileController.getProfile(packet);
    return results.should.eventually.be.rejected;
  });

  it('should return failure if user does not exist', function() {
    packet.data = {
      UserID: 0
    };

    var results = GetProfileController.getProfile(packet);
    return results.should.eventually.be.rejected;

  });

  it('should return valid results if user exists', function() {

    packet.data = {
      UserID: 3
    };

    var expectedResults = {
      UserID: 3,
      FirstName: 'Evan',
      LastName: 'Wood',
      Birthday: '19820212',
      PictureURL: config.baseUrl + 'UserUploads/ProfilePictures/men-0.jpg',
      // CoverPictureURL: '',
      AverageFitness: 4,
      AveragePassing: 1,
      AverageRating: 3.25,
      AverageShooting: 3,
      AverageReliability: 5,
      CommentsAllowed: true,
      AlreadyRated: true
    };
    var results = GetProfileController.getProfile(packet);

    return results.should.eventually.include(expectedResults)
      .and.should.eventually.have.property('Positions');
  });

});
