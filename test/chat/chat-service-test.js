var ChatService = require('services/chat-service');

describe('ChatController', function() {

  it('getChatSession() should return session info', function(done) {
    ChatService.getChatSession(1).then(function(success) {
      console.log(success);
      done();
    }, function(error) {
      console.log(error);
      done();
    });
  });

});