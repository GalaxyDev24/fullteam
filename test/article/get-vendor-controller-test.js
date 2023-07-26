"use strict";

/* jshint esversion: 6 */

let GetVendorController = require('controllers/article/get-vendor-controller');

describe('GetVendorController', function() {
  it('should return failure with no params', function() {
    let packet = { userID: 1, data: {}, };
    let results = GetVendorController.getVendor(packet);
    return results.should.eventually.be.rejected;
  });

  it('should return success given a valid VendorID', function() {
    let packet = { userID: 1, data: {VendorID: 4}, };
    let results = GetVendorController.getVendor(packet);
    return Promise.all([
      results.should.eventually.have.property('Success', 0),
      results.should.eventually.have.property('Vendor'),
    ]);
  });
});


