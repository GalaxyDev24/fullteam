var ChangeLocationController = require('controllers/change-location-controller');
var app = require('lib/application');

describe('ChangeLocationController', function() {
    it('changeLocation() should return Success with valid params', 
    function() {
        var data = {
            'Latitude': 1.204,
            'Longitude': 1092.1238123,
            'Locality': "Test Locality 1",
            'Country': "Test Country",
        };
        var packet = {
            userID: 0,
            data: data
        }
        
        var results = ChangeLocationController.changeLocation(packet);
        var expectedResults = {
            'Success': 0,
            'Description': null
        };
        
        return Promise.all([
            expect(results).to.eventually.deep.equal(expectedResults),
        ]);
    });

    it('changeLocation() should return Success with long number params', 
    function() {
        var data = {
            'Latitude': 1.20129301293810238910238129102391234,
            'Longitude': 1092.123812129308129038129038192308192033,
            'Locality': "Test Locality 2",
            'Country': "Test Country",
        };
        var packet = {
            userID: 0,
            data: data
        }
        
        var results = ChangeLocationController.changeLocation(packet);
        var expectedResults = {
            'Success': 0,
            'Description': null
        };
        
        return Promise.all([
            expect(results).to.eventually.deep.equal(expectedResults),
        ]);
    });
    
    it('changeLocation() should return error for invalid request parameters', function() {
        var packet = {
            userID: 0,
            data: {}
        }

        var results = ChangeLocationController.changeLocation(packet);
        var expectedResults = {
            'Success': 1,
            'Description': "Invalid Parameters"
        };
        
        return Promise.all([
            expect(results).to.eventually.deep.rejectedWith(expectedResults),
        ]);
    });

});

