
"use strict";

var EventEmitter = require('lib/event-emitter');

class Application {
    
    constructor() {
        this.time = (new Date()).getTime();
        this.connections = {};
        this.eventEmitter = new EventEmitter();
    }

    authenticate(key, userID) {
        if (key) {
            this.connections[key] = userID;
        }
    }
    getConnectionKeys(userID) {
        var keys = [];
        for (var key in this.connections) {
            if (this.connections[key] == userID) {
                keys.push(key);
            }
        }
        return keys;
    }

    sendAsyncMessage(userID, data) {
        console.log('sendAsyncMessage: ' + userID);
        var keys = this.getConnectionKeys(userID);
        if (!keys || keys.length < 1) {
            return;
        }
        for(var i = 0; i < keys.length; i++) {
          this.emit('server.send', {
              key: keys[i],
              data: data,
          });
        }
    }

    setEventEmitter(emitter) {
        console.log('app emiiter set :: ');
        this.eventEmitter = emitter;
    }

    on(action, callback) {
        console.log('app on :: ' + action);
        if (!this.eventEmitter) {
            return;
        }

        return this.eventEmitter.on(action, callback);
    }

    emit(action, arg1) {
        if (!this.eventEmitter) {
            return;
        }
        console.log('app emit :: ' + action);

        return this.eventEmitter.emit(action, arg1);
    }

}

var app = new Application();

module.exports = app;