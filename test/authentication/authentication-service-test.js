var AuthService = require('services/authentication-service');

describe('AuthService', function() {

    it('checkCredentials() should return error for invalid credentials', function() {

        return Promise.all([
            AuthService.checkCredentials('umar.bahadoor@gmail.com', '1234').should.be.rejected,
        ]);

    });

    it('checkCredentials() should return Success for valid credentials', function() {

        return Promise.all([
            AuthService.checkCredentials('Evan.Wood@example.com', 'secret').should.be.fulfilled,
        ]);

    });

});
