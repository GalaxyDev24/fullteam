var ValidatorsService = require('services/validators');
var assert = require('assert');

describe('ValidatorsService', function() {
    it('isBoolean() should call the onError function when value is not a boolean', function() {
        var a = 0;
        ValidatorsService.isBoolean.validate("asd", function(err, b, c) {
            a = 1;
        });
        assert.equal(a, 1);
    });
    it('isBoolean() should not call the onError function when value is a boolean', function() {
        var a = 0;
        ValidatorsService.isBoolean.validate(true, function(err, b, c) {
            a = 1;
        });
        assert.equal(a, 0);
    });
});

