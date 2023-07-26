var RegistrationService = require('services/registration-service');

describe('RegistrationService', function() {
  it('emailExists() should return true if user email already exists', function() {
    return Promise.all([
      expect(RegistrationService.emailExists('umar.bahadoor@gmail.com')).to.eventually.equal(true),
      expect(RegistrationService.emailExists('umar.bahadoor@example.com')).to.eventually.equal(true),
    ]);
  });

  it('emailExists() should return false if user email does not exists', function() {
    return Promise.all([
      expect(RegistrationService.emailExists('notexistingemail@gmail.com')).to.eventually.equal(false),
      expect(RegistrationService.emailExists('umar.bahadoor@example.co.uk')).to.eventually.equal(false),
    ]);
  });
});
