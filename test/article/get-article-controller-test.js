"use strict";

/* jshint esversion: 6 */

let GetArticleController = require('controllers/article/get-article-controller');

describe('GetArticleController', function() {
  it('should return failure with no params', function() {
    let packet = { userID: 1, data: {}, };
    let results = GetArticleController.getArticle(packet);
    return results.should.eventually.be.rejected;
  });

  it('should return success given a valid ArticleID', function() {
    let packet = { userID: 1, data: {ArticleID: 4}, };
    let results = GetArticleController.getArticle(packet);
    return Promise.all([
      results.should.eventually.have.property('Success', 0),
      results.should.eventually.have.property('Article'),
    ]);
  });
});

