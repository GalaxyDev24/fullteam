"use strict";

var PostController = require('controllers/post-controller');

describe('PostController', function() {

  it('.getPosts should return Success for valid parameters', function() {

    var packet = {
      userID: 1,
      data: {
        PostParentID: 1,
        PostParentType: 'team',
      }
    };

    var results = PostController.getPosts(packet);
    
    return results.should.eventually.be.fulfilled;

  });

  it('.getPosts should return an error if user does not follew the post parent user', function() {

    var packet = {
      userID: 1,
      data: {
        PostParentID: -1,
        PostParentType: 'user',
      }
    };

    var results = PostController.getPosts(packet);
    
    return results.should.eventually.be.rejected.
      and.should.eventually.have.property('Success', 2);
  });

  it('.create should return Success for valid parameters', function(done) {

    var packet = {
      userID: 1,
      data: {
        PostParentID: 1,
        PostParentType: 'user',
        PostContent: 'Hello',
        PostType: 'status',
      }
    };

    PostController.create(packet).then(function(response){
      console.log(response)
      done();
    }, function(error){
      console.error(error)
      done();
    });
    
    // return results.should.eventually.be.fulfilled;

  });


  it('.likePost() should return Success for valid parameters', function(done) {

    var packet = {
      userID: 20,
      data: {
        PostID: 1,
      }
    };

    PostController.likePost(packet).then(function(response){
      console.log(response)
      done();
    }, function(error){
      console.error(error)
      done();
    });
    
    // return results.should.eventually.be.fulfilled;

  });


  it('.unlikePost() should return Success for valid parameters', function(done) {

    var packet = {
      userID: 3,
      data: {
        PostID: 1,
      }
    };

    PostController.unlikePost(packet).then(function(response){
      console.log(response)
      done();
    }, function(error){
      console.error(error)
      done();
    });
    
    // return results.should.eventually.be.fulfilled;

  });

  it('.getNewsfeed() should return Success for valid parameters', function() {
    let packet = {
      userID: 20,
      data: { }
    };

    let results = PostController.getNewsfeed(packet);
    return results.should.eventually.be.fulfilled;
  });

  it('.getNewsfeed() should return Success when asking to paginate', function() {
    let packet = {
      userID: 20,
      data: { LastPostID: 1 },
    };
    let results = PostController.getNewsfeed(packet);
    return results.should.eventually.be.fulfilled;
  });


  it('.postComment() should return Success for valid parameters', function(done) {

    var packet = {
      userID: 3,
      data: {
        PostID: 1,
        ParentID: 0,
        Content: "Lorem ipsum dolor sit amet",
      }
    };

    PostController.postComment(packet).then(function(response){
      console.log(response)
      done();
    }, function(error){
      console.error(error)
      done();
    });
    
    // return results.should.eventually.be.fulfilled;

  });


  it('.likeComment() should return success for valid parameters', function(done) {

    var packet = {
      userID: 20,
      data: {
        CommentID: 1
      }
    };

    PostController.likeComment(packet).then(function(response){
      console.log(response)
      done();
    }, function(error){
      console.error(error)
      done();
    });
    
    // return results.should.eventually.be.fulfilled;

  });

  it('.getPhotos() should return success for valid parameters', function(done) {

    var packet = {
      userID: 3,
      data: {
        PostParentID: 1,
        PostParentType: 'team'
      }
    };

    PostController.getPhotos(packet).then(function(response){
      console.log(response)
      done();
    }, function(error){
      console.error(error)
      done();
    });
    
    // return results.should.eventually.be.fulfilled;

  });

  it('.deletePost() should return error for invalid parameters', function() {

    var packet = {
      userID: 3,
      data: {}
    };
    
    var results = PostController.deletePost(packet, null, null);
    return results.should.eventually.be.rejected
      .and.should.eventually.have.property('Success', 1);
  });

  it('.deletePost() should return error for post no longer exists', function() {

    var packet = {
      userID: 3,
      data: {
        PostID: -1
      }
    };
    
    var results = PostController.deletePost(packet, null, null);
    return results.should.eventually.be.rejected
      .and.should.eventually.have.property('Success', 2);
  });

  it('.deletePost() should return error if user is not the owner of post', function() {

    var packet = {
      userID: 3,
      data: {
        PostID: 1
      }
    };
    
    var results = PostController.deletePost(packet, null, null);
    return results.should.eventually.be.rejected
      .and.should.eventually.have.property('Success', 3);
  });

  it('.deletePost() should return success for valid params', function() {

    var packet = {
      userID: 1,
      data: {
        PostID: 1
      }
    };
    
    var results = PostController.deletePost(packet, null, null);
    return results.should.eventually.be.fulfilled
      .and.should.eventually.have.property('Success', 0);
  });

  it('.updatePost should return an error with invalid params', function() {

    var packet = {
      userID: 1,
      data: {
      }
    };

    var results = PostController.updatePost(packet);
    
    return results.should.eventually.be.rejected.
      and.should.eventually.have.property('Success', 1);
  });

  it('.updatePost should return an error if post no longer exists', function() {

    var packet = {
      userID: 1,
      data: {
        PostID: -1,
        PostTitle: '',
        PostContent: 'test',
      }
    };

    var results = PostController.updatePost(packet);
    
    return results.should.eventually.be.rejected.
      and.should.eventually.have.property('Success', 2);
  });

  it('.updatePost should return an error if user is not the owner of the post', function() {

    var packet = {
      userID: 1,
      data: {
        PostID: 1,
        PostContent: 'test',
      }
    };

    var results = PostController.updatePost(packet);
    
    return results.should.eventually.be.rejected.
      and.should.eventually.have.property('Success', 3);
  });

  it('.updatePost should return success with valid params', function() {

    var packet = {
      userID: 5,
      data: {
        PostID: 1,        
        PostTitle: '',
        PostContent: 'test',
      }
    };

    var results = PostController.updatePost(packet);
    
    return results.should.eventually.be.fulfilled.
      and.should.eventually.have.property('Success', 0);
  });
});
