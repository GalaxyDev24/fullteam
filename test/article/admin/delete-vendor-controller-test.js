"use strict";

/* jshint esversion: 6 */

let DeleteVendorController =
  require('controllers/article/admin/delete-vendor-controller');

describe('DeleteVendorController', function() {
  it('should return error on no params given', function() {
    let packet = { UserID: 1, data: {} };
    let res = DeleteVendorController.deleteVendor(packet);
    return res.should.eventually.be.rejected;
  });

  it('should return failure when admin token incorrect', function() {
    let packet = { UserID: 1, data: {
      VendorID: 1,
      AdminToken: "aldskjasdd",
    } };
    let res = DeleteVendorController.deleteVendor(packet);
    return res.should.eventually.be.rejected;
  });

  it('should return success for correct parameters', function() {
    let packet = { UserID: 1, data: {
      VendorID: 1,
      AdminToken: "asd",
    } };
    let res = DeleteVendorController.deleteVendor(packet);
    return res.should.eventually.have.property('Success', 0);
  });
});



