// Authentication Controller Test
// -------
"use strict";

var authController = require('controllers/authentication-controller');
var app = require('lib/application');
var sinon = require('sinon')

describe('AuthenticationController', function() {
    var sandbox;

    beforeEach(function() {
        sandbox = sinon.sandbox.create();
        sandbox.stub(app, "authenticate");
    });

    afterEach(function() {
        sandbox.restore();
    });


    it('login() should return error for invalid request parameters', function() {

        var results = authController.login({}, {}, app);

        var expectedResults = {
            'Success': 1,
            'Description': "Invalid Parameters"
        };

        var data = {};
        var results2 = authController.login({data: data}, {}, app);
        var expectedResults2 = {
            'Success': 1,
            'Description': "Invalid Parameters"
        };

        return Promise.all([
            results.should.be.rejected.and.eventually.include(expectedResults),
            results2.should.be.rejected.and.eventually.include(expectedResults2),
        ]);

    });


    it('login() should return Success for valid request parameters', function() {

        var data = {
            LoginType: 0,
            // FacebookAccessToken: '',
            Email: 'umar.bahadoor@gmail.com',
            Password: 'secret',
            // LoginToken: '',
        };
        
        var results = authController.login({data: data}, {}, app);

        var data = {
            LoginType: 0,
            LoginToken: 'abc',
        };
        
        var result2 = authController.login({data: data}, {}, app);
        
        return Promise.all([
            results.should.be.fulfilled.and.eventually.include({ Success: 0}).keys(['UserID', 'LoginToken']),
        ]);

    });


});
