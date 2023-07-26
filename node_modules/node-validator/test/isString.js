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

describe('validator.isString', function () {
  it('should pass strings',
    function () {
      validator.isString().validate('', expectSuccess);
      validator.isString().validate('asdfasdf', expectSuccess);
    });

  it('should test regex options',
    function () {
      should.exist(validator.isString({regex: /^[abc]+$/}).validate('', expectFailure));
      should.exist(validator.isString({regex: /^[\w\d\-_].*$/}).validate('', expectFailure));
      validator.isString({regex: /^[\w\d\-_].*$/}).validate('asd', expectSuccess);
      validator.isString({regex: /^[abc]+$/}).validate('a', expectSuccess);
      validator.isString({regex: /^[abc]+$/}).validate('b', expectSuccess);
      validator.isString({regex: /^[abc]+$/}).validate('c', expectSuccess);
      validator.isString({regex: /^[abc]+$/}).validate('bca', expectSuccess);
      should.exist(validator.isString({regex: /^[abc]+$/}).validate('d', expectFailure));
      should.exist(validator.isString({regex: /^[abc]+$/}).validate('3', expectFailure));
    });

  it('should test fail regex match of empty child element',
    function (done) {
      var check = validator.isObject()
        .withRequired('test', validator.isString({regex: /^[abc]+$/}));

      var toValidate = {test:''};
      should.exist(check.validate(toValidate, expectFailure));

      validator.run(check, toValidate, function(errorCount, errors) {
        errorCount.should.equal(1);
        errors.should.have.length(1);
        errors[0].message.should.equal('Invalid value. Value must match required pattern.');
        errors[0].parameter.should.equal('test');
        errors[0].value.should.equal('');
        done();
      });
    });

  it('should fail non-strings',
    function () {
      should.exist(validator.isString().validate(true, expectFailure));
      should.exist(validator.isString().validate(null, expectFailure));
      should.exist(validator.isString().validate(0, expectFailure));
      should.exist(validator.isString().validate(1, expectFailure));
      should.exist(validator.isString().validate(123.5, expectFailure));
      should.exist(validator.isString().validate({}, expectFailure));
      should.exist(validator.isString().validate([], expectFailure));
      should.exist(validator.isString().validate(function () {}, expectFailure));
    });

});