"use strict";

/* jshint esversion: 6 */

let EditArticleController =
  require('controllers/article/admin/edit-article-controller');

let img = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0"
    + "NAAAAKElEQVQ4jWNgYGD4Twzu6FhFFGYYNXDUwGFpIAk2E4dHDRw1cDgaCAASFOffhEIO"
    + "3gAAAABJRU5ErkJggg==";

describe('EditArticleController', function() {
  it('should return error on no params given', function() {
    let packet = { UserID: 1, data: {} };
    let res = EditArticleController.editArticle(packet);
    return res.should.eventually.be.rejected;
  });

  it('should return failure when admin token incorrect', function() {
    let packet = { UserID: 1, data: {
      Title: "ASD",
      Picture: img,
      ArticleID: 1,
      AdminToken: "aldskjasdd",
    } };
    let res = EditArticleController.editArticle(packet);
    return res.should.eventually.be.rejected;
  });

  it('should return success for correct parameters without picture', function() {
    let packet = { UserID: 1, data: {
      Title: 'asd',
      Picture: img,
      ArticleID: 1,
      AdminToken: "asd",
    } };
    let res = EditArticleController.editArticle(packet);
    return res.should.eventually.have.property('Success', 0);
  });

  it('should return success for correct parameters', function() {
    let packet = { UserID: 1, data: {
      Title: 'asd',
      Picture: img,
      Body: "asdasds",
      TimePosted: (new Date()).getTime(),
      VendorID: 1,
      AdminToken: "asd",
      ArticleID: 1,
    } };
    let res = EditArticleController.editArticle(packet);
    return res.should.eventually.have.property('Success', 0);
  });
});


