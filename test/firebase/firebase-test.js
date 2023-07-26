
var sinon = require('sinon');
var proxyquire = require('proxyquire');

describe('Firebase', function() {

    const firebase = proxyquire('helpers/firebase', {
        'request-promise': sinon.spy(function(options){
            return Promise.resolve()
        }),
    });

    it('should return send appropriate http request', function() {
        var gcmid = 'abcd';
        var data = {};
        var results = firebase.sendPushNotification(gcmid, data);
        
        return Promise.all([
            results.should.eventually.be.fulfilled,
        ]);

    });

});