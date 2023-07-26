let AdminLoginController = require('controllers/admin-login-controller');

describe('AdminLoginController', function() {
  it('should return failure for bad password', function() {
    let packet = {data: {Pass: "asd"}};
    let res = AdminLoginController.adminLogin(packet);
    return res.should.eventually.be.rejected;
  });

  it('should return success for good pass', function() {
    let packet = {data: {Pass: "akjs02kslkdmAKjsajs"}};
    let res = AdminLoginController.adminLogin(packet);
    return Promise.all([
      res.should.eventually.have.property('Success', 0),
      res.should.eventually.have.property('Token'),
    ]);
  });
});

