var log = require('helpers/logger'); 
var q = require('q');

function Router(app) {

    this.app = app;
    this.routes = {};

    /** Authenticate a packet with a userID and password */
    this.httpAuthenticate = function(packet) {
        return app.connections[packet.loginToken];
    }

    this.on = function(command, callback, unsecure) {
        if(typeof unsecure === 'undefined') {
            unsecure = false;
        }
        this.routes['_' + command] = {
            callback: callback, 
            unsecure: unsecure
        };
    };

    this.route = function(packet) {
        log.info('Routing: ' + packet.cmd);
        var authenticated = false;
        var userID = httpAuthenticate(packet);
        if (typeof userID !== 'undefined') {
            authenticated = true;
            packet.userID = userID;
        }

        if (this.routes.hasOwnProperty('_' + packet.cmd)) {
            log.info('Data: ' + packet.data);
            var route = this.routes['_' + packet.cmd];
            if (!route.unsecure && !authenticated) {
                return q.fcall(function () {
                    throw new Error('Unauthorized.');
                });
            }

            var response = {};

            return route.callback.call(null, packet, response, this.app);
        }

        return q.fcall(function () {
            throw new Error('No routes found.');
        });
    };

    return this;

}

module.exports = Router;
