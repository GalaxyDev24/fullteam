var log = require('helpers/logger'); 
var q = require('q');
var knex = require('lib/knex');

function Router(app) {

    this.app = app;
    this.routes = {};

    this.addRoute = function(route) {
      var command = route.command;
      
      if(typeof route.secure === 'undefined') {
          route.secure = false;
      }
      if(typeof route.callback === 'undefined') {
          route.callback = route.controller[route.method];
      }

      this.routes['_' + command] = route;

    };

    this.route = function(packet) {

        log.info('Routing: ' + packet.cmd);
        var authenticated = false;
        var userID = false;

        if(this.app.connections.hasOwnProperty(packet.connection.key)) {
            userID = this.app.connections[packet.connection.key];
        }

        if(userID) {
            authenticated = true;
            packet.userID = userID;
            knex('user')
              .where('id', packet.userID)
              .update({'last_active' : Date.now()})
              .then(function(){});
        }

        if (this.routes.hasOwnProperty('_' + packet.cmd)) {
            log.info('Data: ' + packet.data);
            var route = this.routes['_' + packet.cmd];
            if (route.secure && !authenticated) {
                return q.fcall(function () {
                    throw new Error('Unauthorized.');
                });
            }

            var response = {};

            return route.callback.call(route.controller, packet, response, this.app);
        }

        return q.fcall(function () {
            throw new Error('No routes found.');
        });
    };

    return this;

}

module.exports = Router;
