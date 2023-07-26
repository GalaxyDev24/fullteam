var config = require('config');

var app = require('lib/application');
var controller = require('controllers/user-controller');

describe('UserController', function() {

    var packet = {
        userID: 1,
        data: {}
    };

    it('getUserData() should return failure if user does not exist', function() {
        packet.userID = -1;
        packet.data = {};

        var results = controller.getUserData(packet);
        return results.should.eventually.be.rejected // .then(function(obj){console.log(obj)});
            .and.have.property('Description')
            .that.equals('User not found');

    });

    it('getUserData() should return correct data for user with id 1', function() {
        packet.userID = 1;
        packet.data = {};

        var results = controller.getUserData(packet);

        return results.should.eventually.be.fulfilled.then(function(response) {
            response.should.have.property('Email').that.equals('umar.bahadoor@gmail.com');
            response.should.have.property('Birthday').that.equals('19880509');
            response.should.have.property('PictureURL').that.equals(config.baseUrl + 'UserUploads/ProfilePictures/men-7.jpg');
        });

    });

    it('getUserData() should return correct data for user with id 5', function() {
        packet.userID = 5;
        packet.data = {};

        var results = controller.getUserData(packet);

        return results.should.eventually.be.fulfilled.then(function(response) {
            response.should.have.property('Email').that.equals('Berk.Black@example.com');
            response.should.have.property('Birthday').that.equals('19840116');
            response.should.have.property('PictureURL').that.equals(config.baseUrl + 'UserUploads/ProfilePictures/men-12.jpg');
        });

    });

    it('updateData() should return failure if user does not exist', function() {

        packet.userID = -1;
        packet.data = {};

        var results = controller.updateData(packet);
        return results.should.eventually.be.rejected;

    });

    it('updateData() should return failure for invalid data', function() {
        packet.data = {
            UserID: -1
        };

        var results1 = controller.updateData(packet);

        packet.userID = 1;
        packet.data = {
            Email: 'one'
        };

        var results2 = controller.updateData(packet);

        packet.userID = 1;
        packet.data = {
            Birthday: 'one'
        };

        var results3 = controller.updateData(packet);

        packet.userID = 1;
        packet.data = {
            Birthday: '2010-09-09'
        };

        var results4 = controller.updateData(packet);

        packet.userID = 1;
        packet.data = {
            FirstName: 'a'
        };

        var results5 = controller.updateData(packet);

        packet.userID = 1;
        packet.data = {
            LastName: 'a'
        };

        var results6 = controller.updateData(packet);

        return Promise.all([
            results1.should.be.rejected,
            results2.should.be.rejected,
            results3.should.be.rejected,
            results4.should.be.rejected,
            results5.should.be.rejected,
            results6.should.be.rejected,
        ]);

    });

    it('updateData() should succeed for valid data', function() {
        packet.userID = 20;
        packet.data = {
            UserID: 20
        };

        var results1 = controller.updateData(packet);

        packet.userID = 21;
        packet.data = {};

        var results2 = controller.updateData(packet);

        packet.data = {
            Email: 'Warren.Haynes@example.net'
        };

        var results3 = controller.updateData(packet);

        packet.data = {
            FirstName: 'Werren',
            LastName: 'Haaynes',
            Birthday: '19930603'
        };

        var results4 = controller.updateData(packet);

        return Promise.all([
            results1.should.be.fulfilled,
            results2.should.be.fulfilled,
            results3.should.be.fulfilled,
        ]);

    });

    /*
     * changeBirthday Method.
     *
     */

    it('changeBirthday() should return failure for no params', function() {
        packet.data = {};
        var results = controller.changeBirthday(packet);
        return results.should.be.rejected;
    });


    it('changeBirthday() should return failure for invalid params', function() {
        packet.userID = 22;
        packet.data = {
            Birthday: '',
        };

        var results1 = controller.changeBirthday(packet);

        packet.data = {
            Birthday: '2016-05-05',
        };

        var results2 = controller.changeBirthday(packet);

        packet.data = {
            Birthday: 10,
        };

        var results3 = controller.changeBirthday(packet);

        return Promise.all([
            results1.should.be.rejected,
            results2.should.be.rejected,
            results3.should.be.rejected,
        ]);

    });

    it('changeBirthday() should return failure if user does not exist', function() {
        packet.userID = -1;
        packet.data = {
            Birthday: '20160505',
        };

        var results = controller.changeBirthday(packet);
        return results.should.eventually.be.rejected;

    });


    it('changeBirthday() should return Success for valid params', function() {
        packet.userID = 22;
        packet.data = {
            Birthday: '19850505',
        };

        var results1 = controller.changeBirthday(packet);

        packet.userID = 22;
        packet.data = {
            Birthday: '19850506',
        };

        var results2 = controller.changeBirthday(packet);

        return Promise.all([
            results1.should.be.fulfilled,
            results2.should.be.fulfilled,
        ]);

    });



    /*
     * addGCMID Method.
     *
     */

    it('addGCMID() should return failure for no params', function() {
        packet.data = {};
        var results = controller.addGCMID(packet);
        return results.should.be.rejected;
    });

    it('addGCMID() should return failure for invalid params', function() {
        packet.userID = 22;
        packet.data = {
            GCMID: '',
        };

        var results1 = controller.addGCMID(packet);

        return Promise.all([
            results1.should.be.rejected
        ]);
    });

    it('addGCMID() should return failure if user does not exist', function() {
        packet.userID = -1;
        packet.data = {
            GCMID: 'onetwothree',
        };
        var results = controller.changeBirthday(packet);
        return results.should.eventually.be.rejected;
    });

    it('addGCMID() should return Success for valid params', function() {
        packet.userID = 22;
        packet.data = {
            GCMID: 'onetwothree',
        };

        var results1 = controller.addGCMID(packet);
        packet.userID = 23;
        packet.data = {
            GCMID: 'onetwothreefour',
        };

        var results2 = controller.addGCMID(packet);

        return Promise.all([
            results1.should.be.fulfilled,
            results2.should.be.fulfilled,
        ]);
    });

    it('addGCMID() should return success when adding the same GCM ID twice', function() {
        packet.userID = 22;
        packet.data = {
            GCMID: 'asd',
        };

        var results1 = controller.addGCMID(packet);
        var results2 = controller.addGCMID(packet);

        return Promise.all([
            results1.should.be.fulfilled,
            results2.should.be.fulfilled,
        ]);
    });




    it('followUser() should return success for valid data.', function() {
        packet.userID = 25;
        packet.data = {
            UserID: 4
        };
        var results1 = controller.followUser(packet);
        return results1.should.eventually.be.fulfilled; //.and.have.property('description').that.equal('Cannot find team invite.');
    });

    it('followUser() should return success for valid data.', function() {
        packet.userID = 25;
        packet.data = {
            UserID: 4
        };
        var results1 = controller.followUser(packet);
        return results1.should.eventually.be.fulfilled; //.and.have.property('description').that.equal('Cannot find team invite.');
    });


    it('followUser() should return success for valid data.', function() {
        packet.userID = 26;
        packet.data = {
            UserID: 4
        };
        var results1 = controller.followUser(packet);
        return results1.should.eventually.be.fulfilled; //.and.have.property('description').that.equal('Cannot find team invite.');
    });

    it('unfollowUser() should return success for valid data.', function() {
        packet.userID = 25;
        packet.data = {
            UserID: 4
        };
        var results1 = controller.unfollowUser(packet);
        return results1.should.eventually.be.fulfilled; //.and.have.property('description').that.equal('Cannot find team invite.');
    });

    it('getFollowers() should return success error for invalid params', function() {
        packet.userID = 1;
        packet.data = {};

        var results = controller.getFollowers(packet, {}, app);

        return results.should.eventually.be.rejected.then(function(response) {

            console.log(response);
            response.should.have.property('Success').that.equals(1);
            // response.should.have.property('Followers').that.is.an('array');
        });

    });

    it('getFollowers() should return success for a valid user id', function() {
        packet.userID = 1;
        packet.data = {
            UserID: 4
        };

        var results = controller.getFollowers(packet, {}, app);

        return results.should.eventually.be.fulfilled.then(function(response) {

            console.log(response);
            response.should.have.property('Success').that.equals(0);
        });

    });

    it('getFollowedUsers() should return success for a valid user id', function() {
        packet.userID = 26;

        var results = controller.getFollowedUsers(packet, {}, app);

        return results.should.eventually.be.fulfilled.then(function(response) {

            console.log(response);
            response.should.have.property('Success').that.equals(0);
        });

    });

    it('getBlockedUsers() should return success for a valid user id', function() {
        packet.userID = 1;

        var results = controller.getBlockedUsers(packet, {}, app);

        return results.should.eventually.be.fulfilled.then(function(response) {

            console.log(response);
            response.should.have.property('Success').that.equals(0);
        });

    });

    it('getQuickbloxData() should return correct data for user with id 1', function() {
        packet.userID = 1;
        packet.data = {};

        var results = controller.getQuickbloxData(packet);

        return results.should.eventually.be.fulfilled.then(function(response) {
            response.should.have.property('Success').that.equals(0);
        });

    });

});
