"use strict";

/* jshint esversion: 6 */

let GetVendorArticlesController = require('controllers/article/get-vendor-articles-controller');

describe('GetVendorArticlesController', function() {
  it('should return failure with no params', function() {
    let packet = { userID: 1, data: {}, };
    let results = GetVendorArticlesController.getVendorArticles(packet);
    return results.should.eventually.be.rejected;
  });

  it('should return success given a valid vendor ID', function() {
    let packet = { userID: 1, data: {VendorID: 4}, };
    let results = GetVendorArticlesController.getVendorArticles(packet);
    return Promise.all([
      results.should.eventually.have.property('Success', 0),
      results.should.eventually.have.property('Articles').that.has.length(1),
    ]);
  });
});
