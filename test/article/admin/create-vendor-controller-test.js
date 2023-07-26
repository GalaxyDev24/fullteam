"use strict";

/* jshint esversion: 6 */

let CreateVendorController =
  require('controllers/article/admin/create-vendor-controller');


let img = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0"
    + "NAAAAKElEQVQ4jWNgYGD4Twzu6FhFFGYYNXDUwGFpIAk2E4dHDRw1cDgaCAASFOffhEIO"
    + "3gAAAABJRU5ErkJggg==";

describe('CreateVendorController', function() {
  it('should return error on no params given', function() {
    let packet = { UserID: 1, data: {} };
    let res = CreateVendorController.createVendor(packet);
    return res.should.eventually.be.rejected;
  });

  it('should return failure when admin token incorrect', function() {
    let packet = { UserID: 1, data: {
      VendorName: "ASD",
      VendorPicture: img,
      AdminToken: "aldskjasdd",
    } };
    let res = CreateVendorController.createVendor(packet);
    return res.should.eventually.be.rejected;
  });

  it('should return success for correct parameters', function() {
    let packet = { UserID: 1, data: {
      VendorName: "ASD",
      VendorPicture: img,
      AdminToken: "asd",
    } };
    let res = CreateVendorController.createVendor(packet);
    return res.should.eventually.have.property('Success', 0);
  });
});

