"use strict";

/* jshint esversion: 6 */

let DeleteArticleController =
  require('controllers/article/admin/delete-article-controller');

describe('DeleteArticleController', function() {
  it('should return error on no params given', function() {
    let packet = { UserID: 1, data: {} };
    let res = DeleteArticleController.deleteArticle(packet);
    return res.should.eventually.be.rejected;
  });

  it('should return failure when admin token incorrect', function() {
    let packet = { UserID: 1, data: {
      ArticleID: 1,
      AdminToken: "aldskjasdd",
    } };
    let res = DeleteArticleController.deleteArticle(packet);
    return res.should.eventually.be.rejected;
  });

  it('should return success for correct parameters', function() {
    let packet = { UserID: 1, data: {
      ArticleID: 1,
      AdminToken: "asd",
    } };
    let res = DeleteArticleController.deleteArticle(packet);
    return res.should.eventually.have.property('Success', 0);
  });
});


