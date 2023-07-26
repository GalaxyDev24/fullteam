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

describe('validator.isInteger', function () {
  it('should pass an integer',
    function () {
      validator.isInteger().validate(100, expectSuccess);
      validator.isInteger().validate(0, expectSuccess);
      validator.isInteger().validate(-100, expectSuccess);
    });

  it('should pass string if specified',
      function () {
        validator.isInteger({allowString: true}).validate('123', expectSuccess);
      });

  it('should fail non-integer numbers',
    function () {
      should.exist(validator.isInteger().validate(123.4, expectFailure));
      should.exist(validator.isInteger().validate(-123.4, expectFailure));
    });

  it('should pass non-integer numbers where decimal part is 0',
    function () {
      // this seems strange, but once 123.0 is passed in, it is then simply 123
      validator.isInteger().validate(123.0, expectSuccess);
      validator.isInteger().validate(0.0, expectSuccess);
    });

  it('should fail non-numbers',
    function () {
      should.exist(validator.isInteger().validate('', expectFailure));
      should.exist(validator.isInteger().validate('123', expectFailure));
      should.exist(validator.isInteger().validate('asd', expectFailure));
      should.exist(validator.isInteger().validate(null, expectFailure));
      should.exist(validator.isInteger().validate(true, expectFailure));
      should.exist(validator.isInteger().validate(function () {}, expectFailure));
    });

  it('should enforce "min" constraint',
    function () {
      validator.isInteger({min: 0}).validate(0, expectSuccess);
      validator.isInteger({min: 0}).validate(1, expectSuccess);
    });

  it('should enforce "max" constraint',
    function () {
      validator.isInteger({max: 10}).validate(10, expectSuccess);
      should.exist(validator.isInteger({max: 10}).validate(11, expectFailure));
      validator.isInteger({max: 10}).validate(9, expectSuccess);
      validator.isInteger({max: 0}).validate(-2, expectSuccess);
      should.exist(validator.isInteger({max: 0}).validate(2, expectFailure));
    });

    it('should enforce "min" constraint for negative numbers', function (done) {
        validator.isInteger({min: 0}).validate(-1, function () {
            done();
        });
    });

});