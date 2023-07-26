var communication = require('helpers/communication');

describe('communication', function() {

    it('buildMessage() should return correct buffer', function() {

        var result = '0000000024a35d7b000000437b224c6f67696e54797065223a302c22456d61696c223a22756d61722e62616861646f6f7240676d61696c2e636f6d222c2250617373776f7264223a2261626364227d';

        var buffer = communication.buildWSMessage(0, 0, 614686075, {
            "LoginType": 0,
            "Email": "umar.bahadoor@gmail.com",
            "Password": "abcd"
        });

        var hex = buffer.toString('hex');
        hex.should.equal(result);


    });

});
