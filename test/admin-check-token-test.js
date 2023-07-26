let AdminCheckTokenController = require('controllers/admin-check-token-controller');

describe('AdminCheckTokenController', function() {
  it('should return failure for no params', function() {
    let packet = {data: {}};
    let res = AdminCheckTokenController.checkToken(packet);
    return res.should.eventually.be.rejected;
  });

  it('should return success for good params', function() {
    let packet = {data: {AdminToken: "asd123lkjlkjsdfkjh"}};
    let res = AdminCheckTokenController.checkToken(packet);
    return Promise.all([
      res.should.eventually.have.property('Success', 0),
      res.should.eventually.have.property('IsValid', false),
    ]);
  });
});


