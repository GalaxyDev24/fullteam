"use strict";

/* jshint esversion: 6 */

let GetRecentArticlesController = require('controllers/article/get-recent-articles-controller');

describe('GetRecentArticlesController', function() {
  it('should return failure with no params', function() {
    let packet = { userID: 1, data: {}, };
    let results = GetRecentArticlesController.getRecentArticles(packet);
    return results.should.eventually.be.rejected;
  });

  it('should return all articles when cutoff = 0', function() {
    let packet = { userID: 1, data: {Cutoff: 0}, };
    let results = GetRecentArticlesController.getRecentArticles(packet);
    return Promise.all([
      results.should.eventually.have.property('Success', 0),
      results.should.eventually.have.property('Articles').that.has.length(2),
    ]);
  });
});


