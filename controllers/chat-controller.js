"use strict";

/* jshint esversion: 6 */

var q = require('q'),
    ChatService = require('services/chat-service'),
    Controller = require('controllers/controller');

class ChatController extends Controller {

  constructor() {
    super(null);
  }

  getChatSession(request, response, app) {
    response = {};
    var ctrl = this;
    var deferred = q.defer();

    ChatService.getChatSession(request.userID).then(function(result) {
      response.ApplicationID = result.Session.application_id;
      response.Token = result.Session.token;
      response.success = 0;
      ctrl.asyncCallback(deferred)(null, response);
    }).catch(function(error) {
      ctrl.asyncCallback(deferred)(error);
    });

    return deferred.promise;

  }

}

module.exports = new ChatController();
