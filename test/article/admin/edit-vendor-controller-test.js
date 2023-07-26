let EditVendorController =
  require('controllers/article/admin/edit-vendor-controller');

let img = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0"
    + "NAAAAKElEQVQ4jWNgYGD4Twzu6FhFFGYYNXDUwGFpIAk2E4dHDRw1cDgaCAASFOffhEIO"
    + "3gAAAABJRU5ErkJggg==";

describe('EditVendorController', function() {
  it('should return error on no params given', function() {
    let packet = { UserID: 1, data: {} };
    let res = EditVendorController.editVendor(packet);
    return res.should.eventually.be.rejected;
  });

  it('should return failure when admin token incorrect', function() {
    let packet = { UserID: 1, data: {
      VendorName: "ASD",
      VendorPicture: img,
      AdminToken: "aldskjasdd",
    } };
    let res = EditVendorController.editVendor(packet);
    return res.should.eventually.be.rejected;
  });

  it('should return success for correct parameters without picture', function() {
    let packet = { UserID: 1, data: {
      VendorID: 1,
      VendorName: "ASD",
      AdminToken: "asd",
    } };
    let res = EditVendorController.editVendor(packet);
    return res.should.eventually.have.property('Success', 0);
  });

  it('should return success for correct parameters', function() {
    let packet = { UserID: 1, data: {
      VendorID: 1,
      VendorName: "ASD",
      VendorPicture: img,
      AdminToken: "asd",
    } };
    let res = EditVendorController.editVendor(packet);
    return res.should.eventually.have.property('Success', 0);
  });
});

