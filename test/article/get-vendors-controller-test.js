"use strict";

/* jshint esversion: 6 */

let GetVendorsController = require('controllers/article/get-vendors-controller');

describe('GetVendorsController', function() {
  it('should return success with the right vendor data', function() {
    let packet = { userID: 1, data: {}, };
    let results = GetVendorsController.getVendors(packet);
    return Promise.all([
      results.should.eventually.have.property('Success', 0),
      results.should.eventually.have.property('Vendors').that.has.length(2),
    ]);
  });
});
