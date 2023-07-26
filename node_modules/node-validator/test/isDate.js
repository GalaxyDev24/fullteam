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

describe('validator.isDate', function () {
  it('should pass Date',
    function () {
      validator.isDate().validate(new Date(), expectSuccess);
    });

  it('should pass unix offset (milliseconds)',
    function () {
      validator.isDate().validate(1318781876406, expectSuccess);
    });

  it('should pass string dates',
    function () {
      validator.isDate().validate('2013-02-08', expectSuccess);
      validator.isDate().validate('2013-02-08T09:30:26', expectSuccess);
      validator.isDate().validate('2013-02-08T09:30:26.123', expectSuccess);
      validator.isDate().validate('2013-02-08T09:30:26Z', expectSuccess);
      validator.isDate().validate('2013-02-08T09:30:26+0700', expectSuccess);
    });

  it('should pass string dates with matching formats and fail valid dates with non-matching formats',
    function () {
      validator.isDate({format: 'YYYY-MM-DD'}).validate('2013-02-08', expectSuccess);
      should.exist(validator.isDate({format: 'YYYY-MM-DD'}).validate('2013-02-08T09:30:26', expectFailure));
    });

  it('should fail invalid dates',
    function () {
      should.exist(validator.isDate().validate('asd', expectFailure));
      should.exist(validator.isDate().validate(null, expectFailure));
      should.exist(validator.isDate().validate({}, expectFailure));
      should.exist(validator.isDate().validate([], expectFailure));
      should.exist(validator.isDate().validate(function () {}, expectFailure));
    });

});