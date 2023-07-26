var SearchPlayerController = require('controllers/search-player-controller');
var app = require('lib/application');

describe('SearchPlayerController', function() {
  console.log(SearchPlayerController);

  it('searchDistance() should return error invalid params for on ' + 
     'search distance provided', function() {
       var packet = {
         userID: 1,
         data: {}
       };
       var results = SearchPlayerController.searchByDistance(packet);
       var expectedResults = {
         'Success': 1,
         'Description': "Invalid parameters"
       };
       return Promise.all([
         expect(results).to.eventually.deep.rejectedWith(expectedResults)
       ]);
     });

  it('searchByDistance() should return no results for ' + 
     'SearchDistance: 0', function() {
       var data = {
         'SearchDistance': 0
       };
       var packet = {
         userID: 1,
         data: data
       };

       var results = SearchPlayerController.searchByDistance(packet);
       var expectedResults = {
         'Success': 0,
         'UserList': [],
         'Statistics': {
           'PlayersNearBy': 0,
           'Goalkeepers': 0,
           'Defenders': 0,
           'Midfielders': 0,
           'Attackers': 0,
         },
         'Description': null,
       };
       
       return Promise.all([
         expect(results).to.eventually.deep.equal(expectedResults),
       ]);
     });

  it('searchByDistance() should return Success for ' + 
     'SearchDistance: 20', function() {
       var data = {
         'SearchDistance': 20
       };
       var packet = {
         userID: 1,
         data: data
       };

       var results = SearchPlayerController.searchByDistance(packet);
       
       return Promise.all([
         expect(results).to.eventually.have
           .all.keys('UserList', 'Success', 'Description', 'Statistics'),
         expect(results).to.eventually.have
           .property('UserList').that.has.length(1),
       ]);

       // return results.should.eventually.be.fulfilled
       //    .and.should.eventually.have.property('Success', 0);
     });

  it('searchByName() should return error invalid params for no query ' + 
     'provided' , function() {
       var packet = {
         userID: 1,
         data: {}
       };

       var results = SearchPlayerController.searchByName(packet);
       var expectedResults = {
         'Success': 1,
         'Description': 'Invalid parameters',
       };
       
       return Promise.all([
         expect(results).to.eventually.deep.rejectedWith(expectedResults),
       ]);
     });

  it('searchByName() should return results when searching for "umar"',
     function() {
       var packet = {
         userID: 1,
         data: {"Name": "umar"}
       };

       var results = SearchPlayerController.searchByName(packet);
       
       return Promise.all([
         expect(results).to.eventually.have.all.keys('UserList', 'Success', 'Description'),
         expect(results).to.eventually.have.property('Success', 0)
       ]);
     });

  it('searchByName() should return no results when searching for a blocked user',
     function() {
       var packet = {
         userID: 1,
         data: {"Name": "Evan"}
       };

       var results = SearchPlayerController.searchByName(packet);
       
       return Promise.all([
         expect(results).to.eventually.have.all.keys('UserList', 'Success', 'Description'),
         expect(results).to.eventually.have.property('Success', 0),
         expect(results).to.eventually.have.property('UserList').length(0),
       ]);
     });
});

