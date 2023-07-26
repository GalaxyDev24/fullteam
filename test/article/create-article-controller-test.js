"use strict";

/* jshint esversion: 6 */

let CreateArticleController =
  require('controllers/article/admin/create-article-controller');


let img = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0"
    + "NAAAAKElEQVQ4jWNgYGD4Twzu6FhFFGYYNXDUwGFpIAk2E4dHDRw1cDgaCAASFOffhEIO"
    + "3gAAAABJRU5ErkJggg==";

describe('CreateArticleController', function() {
  it('should return error on no params given', function() {
    let packet = { UserID: 1, data: {} };
    let res = CreateArticleController.createArticle(packet);
    return res.should.eventually.be.rejected;
  });

  it('should return failure when admin token incorrect', function() {
    let packet = { UserID: 1, data: {
      Title: "World Says Hello",
      Body: "Hello, world!",
      VendorID: 1,
      TimePosted: (new Date()).getTime(),
      Picture: img,
      AdminToken: "aslkdjalskdjasd",
    } };
    let res = CreateArticleController.createArticle(packet);
    return res.should.eventually.be.rejected;
  });

  it('should return success for correct parameters', function() {
    let packet = { UserID: 1, data: {
      Title: "World Says Hello",
      Body: "Hello, world!",
      VendorID: 1,
      TimePosted: (new Date()).getTime(),
      Picture: img,
      AdminToken: "asd",
    } };
    let res = CreateArticleController.createArticle(packet);
    return res.should.eventually.have.property('Success', 0);
  });
});


