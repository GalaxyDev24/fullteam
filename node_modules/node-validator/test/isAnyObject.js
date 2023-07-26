var assert = require('assert');
var should = require('should');

var validator = require('../lib/validator');

function expectFailure(message, childName, childValue) {
  message.should.not.be.empty;
  return true;
}

function expectSuccess() {
  assert.fail();
}

describe('validator.isAnyObject', function () {
  it('should pass an object',
    function () {
      validator.isAnyObject().validate({}, expectSuccess);
    });

  it('should fail non-objects',
    function () {
      should.exist(validator.isAnyObject().validate('asd', expectFailure));
      should.exist(validator.isAnyObject().validate(null, expectFailure));
      should.exist(validator.isAnyObject().validate(123.4, expectFailure));
      should.exist(validator.isAnyObject().validate(true, expectFailure));
      should.exist(validator.isAnyObject().validate(function () {}, expectFailure));
    });

  it('should pass with unexpected properties',
    function () {
      validator.isAnyObject().validate({test: true}, expectSuccess);
      validator.isAnyObject().validate({string: 'string'}, expectSuccess);
      validator.isAnyObject().validate({test: 123}, expectSuccess);
    });

  it('should validate optional properties, but not require them',
    function () {
      var v = validator.isAnyObject()
        .withOptional('test', validator.isNumber());
      v.validate({test: 123}, expectSuccess);
      v.validate({test: null}, expectSuccess);
      v.validate({test: undefined}, expectSuccess);
      v.validate({}, expectSuccess);
    });

  it('should validate require required properties',
    function () {
      var v = validator.isAnyObject()
        .withRequired('test', validator.isNumber());
      v.validate({test: 123}, expectSuccess);
      should.exist(v.validate({test: null}, expectFailure));
      should.exist(v.validate({test: undefined}, expectFailure));
      should.exist(v.validate({}, expectFailure));
    });
});