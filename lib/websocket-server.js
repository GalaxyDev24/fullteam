var Packet = require('lib/ws-packet');
var util = require('util');
var communication = require('helpers/communication');
var WebSocketServer = require('ws').Server;
var uid = require('rand-token').uid;
function WebsocketServer(nativeServer, app, router, routes, log) {
  
    var connections = [];
    var connection_keys = {};

    this.start = function() {

        var wss = new WebSocketServer({
          server: nativeServer,
        });

        wss.on('connection', function connection(ws) {

          ws.key = uid(16);
          connections.push(ws);
          connection_keys['_' + ws.key] = connections.length - 1;
          
          log.info('Connection Open');

          ws.on('error', function(error) {
              log.warn('Connection Error', error);
              var index = connection_keys['_' + ws.key];
              delete connections[index];
              delete connection_keys['_' + ws.key];
          });

          ws.on('close', function(code, reason) {
              log.warn('Connection Closed', code, reason);
              var index = connection_keys['_' + ws.key];
              delete connections[index];
              delete connection_keys['_' + ws.key];
          });

          ws.on('message', function (data, flags) {
            if (flags.binary) {
              var cmd = data.readInt16BE(0);
              var opts = data.readInt16BE(2);
              var id = data.readInt32BE(4);
              var dataLen = data.readUInt32BE(8);
              var dataStr = data.toString('utf8', 12, 12 + dataLen);

              try {
                  var packet = new Packet(cmd, opts, id, dataLen, JSON.parse(dataStr), ws);

                  router.route(packet).then(function(response) {
                      ws.send(communication.buildWSMessage(cmd, opts, id, response), function(args) {
                          // console.log(args);
                      });
                  }, function(error) {
                      log.info('+Error Response');
                      log.info(util.inspect(error));
                      ws.send(communication.buildWSMessage(cmd, opts, id, error), function(args) {
                          // console.log(args);
                      });
                  });

              } catch (err) {
                  log.error(err);
              }

            }

          });

        });

        return wss;

    };

    this.send = function(object) {
      var index = connection_keys['_' + object.key];
      var connection = connections[index];
      var data = {
        Notification: {
          data: object.data.data,
          type: object.data.type
        },
      };

      if (connection) {
        connections[index].send(communication.buildWSMessage(16600, 2, 0, data), function(args) {
            console.log(args);
        });
      }
    };

    return this;
}

module.exports = WebsocketServer;
