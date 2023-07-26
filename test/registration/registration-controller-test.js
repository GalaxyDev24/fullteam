var RegistrationController = require('controllers/registration-controller');

describe('registrationcontroller', function() {
  
  it('register() should return error for invalid request parameters', function() {
    var data = {};
    var results = RegistrationController.register({data: data});
    var expectedResults = {
      'Success': 1,
      'Description': "Invalid Parameters"
    };

    return results.should.be.rejected.and.should.eventually.include(expectedResults);
  });

  it('register() should return error if user email already exists', function() {

    var data = {
      'RegistrationType': 0,
      'Email': 'umar.bahadoor@gmail.com',
      'GCMID': '',
      'Positions': [2],
      'FacebookAccessToken': '',
      'Password': 'secret',
      'PictureData': '',
      'Gender': 1,
      'Birthday': '09051988',
      'FirstName': 'Umar',
      'LastName': 'Bahadoor',
    };

    var results = RegistrationController.register({data: data});
    var expectedResults = {
      'Success': 2,
      'Description': "User with this email already exists."
    };

    data.Email = 'umar.bahadoor@example.com';

    var results2 = RegistrationController.register({data: data});
    var expectedResults2 = {
      'Success': 2,
      'Description': "User with this email already exists."
    };

    return Promise.all([
      results.should.be.rejected.and.should.eventually.include(expectedResults),
      results2.should.be.rejected.and.should.eventually.include(expectedResults2)
    ]);

  });

  it('register() should return error if facebook login without valid access token', function() {
    var accessToken = "invalid";
    var data = {
      'RegistrationType': 1,
      'Email': 'um.ar.bahadoor@gmail.com',
      'GCMID': '',
      'Positions': [2],
      'FacebookAccessToken': accessToken,
      'Password': 'secret2',
      'PictureData': '',
      'Birthday': '',
      'FirstName': '',
      'LastName': '',
      'Gender': 9,
    };

    var results = RegistrationController.register({data: data});
    var expectedResults = {
      'Success': 1,
      'Description': "OAuth Exception (Probably wrong access token)."
    };

    return Promise.all([
      results.should.be.rejected.and.should.eventually.include(expectedResults)
    ]);
  });

  it('register() should return Success if twitter login with valid access token', function() {
    var accessToken = "801466065888956416-g8bI9iPhi1T7ruiK8EdfqiJ9FZ3HAoW";
    var accessTokenSecret = "C7oPlYaEw1rvC6G0lUlK9hohzkoxIbrFAOXjKVGUBYoyc";
    var data = {
      'RegistrationType': 2,
      'Email': 'asdasdasd@mail.com',
      'GCMID': '',
      'Positions': [2],
      'TwitterAccessToken': accessToken,
      'TwitterAccessTokenSecret': accessTokenSecret,
      'Birthday': '04051998',
      'Gender': 0,
    };
    var results = RegistrationController.register({data: data});

    return results.should.eventually.be.fulfilled;
  });

  it('register() should return Success if facebook login with valid access token', function() {
    
    // Refresh token if expired..
    // https://graph.facebook.com/oauth/access_token?grant_type=fb_exchange_token&client_id=403899929802018&client_secret=76c9ca29581131505583a5057c20ec05&fb_exchange_token=EAAFvWEfXNSIBAFCXTaZApwvkoeRHu8FbLImvCX1jbYM5WWpXDsIqcCPo6NJ9GTPhZBxw4QwmjZC66X9D8Bp5VHJntmei17lIcpEORRuTVyDaj5xDyQHADbKSaqiyddcbIA93xsLhRh3bOoyaTMr7l3v1Mqt1KdJmfxFZASJeBAZDZD

    var accessToken = "EAAFvWEfXNSIBALpHo3uDIZCdnZAEvRZAbUPXdoufGZCoN2yc0NjT1TmN02R3OStinaty2KgzZByF6AZCnp2lbOoX0JMfhs9748U2gUUpZCoHytUqJZCxtAbtLbNfazRRrAEPdKKPvOFaUvGEb1XjU2kxjrtpEnZB6Wv0ZD";
    var data = {
      'RegistrationType': 1,
      'Email': 'um.ar.bahadoor@gmail.com',
      'GCMID': '',
      'Positions': [2],
      'FacebookAccessToken': accessToken,
      'Password': 'secret2',
      'PictureData': '',
      'Birthday': '',
      'FirstName': '',
      'LastName': '',
      'Gender': 0,
    };

    var results = RegistrationController.register({data: data});

    return Promise.all([
      results.should.be.fulfilled
    ]);
  });

  it('register() should return Success if valid data is sent', function() {


    var img = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0"
        + "NAAAAKElEQVQ4jWNgYGD4Twzu6FhFFGYYNXDUwGFpIAk2E4dHDRw1cDgaCAASFOffhEIO"
        + "3gAAAABJRU5ErkJggg==";

    var data = {
      'RegistrationType': 0,
      'Email': 'umar.bahadoor.' + (new Date()).getTime() + '@gmail.com',
      'GCMID': '',
      'Positions': [2],
      'Password': 'secret',
      'PictureData': img,
      'Birthday': '09051988',
      'FirstName': 'Umar',
      'LastName': 'Bahadoor',
      'Gender': 2,
    };

    var results = RegistrationController.register({data: data});

    return Promise.all([
      results.should.be.fulfilled,
    ]);

  });

});
