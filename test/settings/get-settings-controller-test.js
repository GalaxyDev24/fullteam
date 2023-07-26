var SettingsController = require('controllers/settings-controller');
var app = require('lib/application');
var async = require('async');

describe('SettingsController', function() {
    it('getSettings() should return error to find user settings when no ' + 
       'user settings exists', 
       function() {
           async.waterfall([
               function(callback) {
                   var packet = {
                       userID: 0,
                       data: {}
                   }

                   var results = SettingsController.getSettings(packet);
                   callback(results);
               },
               function(results, callback) {

                   var expectedResults = {
                       'Success': 1,
                       'Description': "User settings data not found"
                   };

                   console.log(results);

                   return Promise.all([
                       expect(results).to.eventually.deep.rejectedWith(expectedResults),
                   ]);
               }])
       });
    it('getSettings() should return Success when user settings are found',
       function() {
           async.waterfall([
               function(callback) {
                   var data = {
                       'CommentsAllowed': true,
                       'NotificationsAllowed': false,
                       'Searchable': true
                   };
                   var packet = {
                       userID: 0,
											 data: data
                   }
                   SettingsController.changeSettings(packet);
               },
               function(callback){

                   var packet = {
                       userID: 0,
                       data: {}
                   }

                   var results = SettingsController.getSettings(packet);
                   callback(null, results);
               },
               function(results, callback){
                   var expectedResults = {
                       'Success': 0,
                       'CommentsAllowed': true,
                       'NotificationsAllowed': false,
                       'Searchable': true,
                   };
                   console.log(results);
                   return Promise.all([
                       expect(results).to.eventually.deep.equal(expectedResults),
                   ]);
               },
           ]);
       });
});
