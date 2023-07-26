"use strict";

var RatingsService = require('services/ratings-service');

describe('RatingsService', function() {

  it('.hasUserBeenRatedBy should return valid results', function(done) {

    var results = RatingsService.hasUserBeenRatedBy(1, 4);

    results.then(function(response){
      console.log(response);
      done();
    }, function(error){
      console.error(error);
      done();
    });

  });

});