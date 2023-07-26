var RateUserController = require('controllers/rate-user-controller');

describe('RateUserController', function() {
    it('should return failure for no params', function() {
        var packet = {
            userID: 1,
            data: {}
        };

        var results = RateUserController.rateUser(packet);

        return results.should.eventually.be.rejected;
    });

    it('should return Success when rating a valid user', function() {
        var data = {
            UserID: 1,
            Passing: 3,
            Shooting: 4,
            Fitness: 5,
            Reliability: 0,
            FeedbackMessage: "Hey therrrre!"
        };

        var packet = {
            userID: 7,
            data: data
        };

        var results = RateUserController.rateUser(packet);

        return Promise.all([expect(results).to.eventually
                            .have.property("Success", 0)]);
    });

    it('should return failure when rating above 5 or below 0',
       function() {
           var data = {
               UserID: 2,
               Passing: 3,
               Shooting: 4,
               Fitness: 6,
               Reliability: 0,
               FeedbackMessage: "Hey therrrre!"
           };

           var packet = {
               userID: 1,
               data: data
           };

           var results = RateUserController.rateUser(packet);

           data.fitness = -1;
           packet.data = data; // Not sure if copied or referenced

           var results2 = RateUserController.rateUser(packet);

           return Promise.all([
               results.should.eventually.be.rejected,
               results2.should.eventually.be.rejected
           ]);

       });

    it('should return failure when rating yourself', function() {
        var data = {
            UserID: 1,
            Passing: 3,
            Shooting: 4,
            Fitness: 3,
            Reliability: 0,
            FeedbackMessage: "Trying to rate myself..."
        };
        var packet = {
            userID: 1,
            data: data
        };
        var results = RateUserController.rateUser(packet);
        return results.should.eventually.be.rejected;
    });

    it('should return failure when rating the same person twice',
       function() {
           var data = {
               UserID: 1,
               Passing: 3,
               Shooting: 4,
               Fitness: 3,
               Reliability: 0,
               FeedbackMessage: "Hey therrrre!"
           };

           var packet = {
               userID: 2,
               data: data
           };

           var results = RateUserController.rateUser(packet);

           return results.should.eventually.be.rejected;


       });

    it('should return failure when rating a blocked user',
       function() {
           var data = {
               UserID: 16,
               Passing: 3,
               Shooting: 4,
               Fitness: 3,
               Reliability: 0,
               FeedbackMessage: "Hey therrrre!"
           };

           var packet = {
               userID: 1,
               data: data
           };

           var results = RateUserController.rateUser(packet);

           return results.should.eventually.be.rejected;
       });
});

