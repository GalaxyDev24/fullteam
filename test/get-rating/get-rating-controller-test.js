var RatingController = require('controllers/get-rating-controller');
var config = require('config');

describe('RatingController', function() {
    it('should return failure for no params given to getRating()',
        function() {
            var packet = {
                userID: 1,
                data: {}
            };

            var results = RatingController.getRating(packet);
            return results.should.eventually.be.rejected;
        });

    it('should return a valid feedback object if one exists',
        function() {
            var data = {
                UserID: 1
            };
            var packet = {
                userID: 3,
                data: data
            };

            var expectedResults = {
                PictureURL: config.baseUrl + "UserUploads/ProfilePictures/men-7.jpg",
                FirstName: "Umar",
                LastName: "Bahadoor",
                Passing: 1,
                Shooting: 3,
                Fitness: 4,
                Reliability: 5,
                AverageRating: 3.25,
                FeedbackMessage: "Test Feedback.",
                Success: 0,
                Description: null
            }
            var results = RatingController.getRating(packet);

            return results.should.be.fulfilled.and.should.eventually.include(expectedResults);
        });

    it('should return an error when no feedback exissts',
        function() {
            var data = {
                UserID: 1123123123
            };
            var packet = {
                userID: 3,
                data: data
            };
            var results = RatingController.getRating(packet);
            return results.should.eventually.be.rejected;
        });
});
