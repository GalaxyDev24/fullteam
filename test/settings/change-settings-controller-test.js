var SettingsController = require('controllers/settings-controller');

describe('SettingsController', function() {
    it('changeSettings() should return Success', function() {
        var data = {
            'CommentsAllowed': true,
            'NotificationsAllowed': false,
            'Searchable': true
        };
        var packet = {
            userID: 0,
            data: data
        }

        var results = SettingsController.changeSettings(packet);
        var expectedResults = {
            'Success': 0,
            'Description': null
        };
        
        return Promise.all([
            expect(results).to.eventually.deep.equal(expectedResults),
        ]);
    });

    it('changeSettings() should return error for invalid request parameters', function() {
        var packet = {
            userID: 0,
            data: {}
        }

        var results = SettingsController.changeSettings(packet);
        var expectedResults = {
            'Success': 1,
            'Description': "Invalid Parameters"
        };
        
        return Promise.all([
            expect(results).to.eventually.deep.rejectedWith(expectedResults),
        ]);
    });
});
