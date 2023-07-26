var chatController = require('controllers/chat-controller');
var app = require('lib/application');
var async = require('async');

describe.skip('ChatController', function() {

  var iterator = 0;

  var testGetQuickbloxSession = function(userID, done) {

    var data = {

    };

    var packet = {
      userID: userID,
      data: data
    }

    var results = chatController.getChatSession(packet)
      .then(function(results) {
        // validated...
        console.log('success');
        console.log(results);
        done();
      }, function(error) {
        console.log('Error');
        console.log(error);
        done();
      });
  }

  it('getChatSession() should return session info', function(done) {
    testGetQuickbloxSession(1, done);
  });

  it('getChatSession() should return session info', function(done) {
    testGetQuickbloxSession(2, done);
  });

  it('getChatSession() should return session info', function(done) {
    testGetQuickbloxSession(3, done);
  });

  it('getChatSession() should return session info - 2', function(done) {
    testGetQuickbloxSession(4, done);
  });

  it('getChatSession() should return session info - 2', function(done) {
    testGetQuickbloxSession(4, done);
  });
  
  // it('getChatSession() should return session info - all', function(done) {

  //   var tasks = [];

  //   for(var i = 1; i < 59; i++){
  //     var task = function(callback) {
  //       iterator = iterator + 1;
  //       testGetQuickbloxSession(iterator, function(){
  //         callback(null);
  //       });
  //     }
  //     tasks.push(task);
  //   }

  //   async.waterfall(tasks, function(err, results){
  //     done();
  //   });

  // });

});