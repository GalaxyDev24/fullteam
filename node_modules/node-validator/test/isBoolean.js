var assert = require('assert');
var should = require('should');

var validator = require('../lib/validator');

function expectFailure(message, childName, childValue) {
  message.should.not.be.empty;
  return true;
}

function expectSuccess() {
  throw new Error('fail');
}

describe('validator.isBoolean', function () {
  it('should pass boolean',
    function () {
      validator.isBoolean().validate(true, expectSuccess);
      validator.isBoolean().validate(false, expectSuccess);
    });

  it('should fail non-booleans',
    function () {
      should.exist(validator.isBoolean().validate('asd', expectFailure));
      should.exist(validator.isBoolean().validate(null, expectFailure));
      should.exist(validator.isBoolean().validate(0, expectFailure));
      should.exist(validator.isBoolean().validate(1, expectFailure));
      should.exist(validator.isBoolean().validate(123.5, expectFailure));
      should.exist(validator.isBoolean().validate({}, expectFailure));
      should.exist(validator.isBoolean().validate([], expectFailure));
      should.exist(validator.isBoolean().validate(function () {}, expectFailure));
    });

});