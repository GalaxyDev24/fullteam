require('app-module-path').addPath(__dirname);
require('dotenv').config();
var fs = require('fs');
var cors = require('cors');
var log = require('helpers/logger');
var app = require('lib/application');
var Router = require('lib/ws-router');
var Server = require('lib/websocket-server');
var EventEmitter = require('lib/event-emitter');
var expressInstance = require('express')();
var config = require('config');
var knex = require('lib/knex');
var eventEmitter = new EventEmitter();

var express = require('express');
var bodyParser = require('body-parser');
var multipartyMiddleware = require('connect-multiparty')();
var requestSanitizer = require('middleware/request-sanitizer');
var authTokenMiddleware = require('middleware/auth-token');
var allowCrossDomain = require('middleware/allow-crossdomain');
var suid = require('rand-token').suid;

if (process.env.NODE_ENV !== 'production'){
  require('longjohn');
}

/*
 * WebSocket Implementation
 */

var nativeServer;

app.setEventEmitter(eventEmitter);
if (config.ws.ssl) {
  nativeServer = require('https').createServer({
    key: fs.readFileSync(config.ws.ssl_key, 'utf8'), 
    cert: fs.readFileSync(config.ws.ssl_cert, 'utf8')
  }, expressInstance);

} else {
  nativeServer = require('http').createServer(expressInstance);
}

nativeServer.listen(config.ws.port);

var router = new Router(app);
var routes = require('routes')(router);
var server = new Server(nativeServer, app, router, routes, log);

server.start();

app.on('server.send', function(obj){
  console.log('--- server.send');
  console.log(obj);
  server.send(obj);
});

/*
 * HTTP Implementation
 */

var webserver = express();
webserver.use(bodyParser.json({limit: '50mb'}));
webserver.use(bodyParser.urlencoded({ extended: true })); 
webserver.use(requestSanitizer);
webserver.use(allowCrossDomain);
webserver.use(authTokenMiddleware);

var corsOptions = {
  origin: '*',
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204 
}
webserver.use(cors(corsOptions));
webserver.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

webserver.options('/*', function (req, res) {
  res.send({});
});

webserver.post('/upload', multipartyMiddleware, function (req, res) {
  // We are able to access req.files.file thanks to the multiparty middleware
  var filename = suid(32) + '.jpg';
  fs.readFile(req.files.file.path, function (err, data) {
    var newPath = __dirname + "/public/UserUploads/" + filename;
    fs.writeFile(newPath, data, function (err) {
      if(err) {
        console.error(err);
        return;
      }

      res.send({
        url: config.baseUrl + 'UserUploads/' + filename,
      });
    });
  });
});

// Make sure we can access the public directory as a user
webserver.use(express.static('public'));

webserver.get('/img/chat/u/:chatUserID', function (req, res) {
  knex.select('reg_info.picture')
    .from('reg_info')
    .innerJoin('user_chat_sessions', 'user_chat_sessions.user_id', '=', 'reg_info.user_id')
    .where('user_chat_sessions.chat_user_id', req.params.chatUserID)
    .first()
    .then(function(row) {
      if(row && typeof row !== 'undefined' && row.picture) {
        res.redirect(row.picture);
        return;
      }

      res.status(404).end('Not found');
      return;

    }, function(err) {
      console.log(err);
      res.status(404).end('Not found');
      return;
    });

});


var addHttpRoute = function (httpServer, httpmethod, endpoint, controller, method, secure, app ) {
  httpServer[httpmethod](endpoint, function(req, res){
    if(secure && !req.userID) {
      res.status(401).send({
        "success": 1,
        "description": "Unauthorized"
      });
      return;
    }
    controller[method](req, res, app).then(function(success){
      // res.set('Content-Type', 'application/json');
      res.send(JSON.stringify(success));
    }, function(err) {
      // res.set('Content-Type', 'application/json');
      res.send(JSON.stringify(err));
    });
  });
};

var httproutes = require('routes')();
for (var k = 0; k < httproutes.length; k = k + 1) {
  addHttpRoute(
    webserver, 
    httproutes[k].httpmethod, 
    httproutes[k].uri, 
    httproutes[k].controller, 
    httproutes[k].method, 
    httproutes[k].secure, 
    app
  );
}

webserver.use(function(req, res, next) {
  res.status(404).send('Sorry cant find that!');
});

webserver.use(function(err, req, res, next) {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});


if (config.https.enabled) {
  var httpsServer = require('https').createServer({
    key: fs.readFileSync(config.https.ssl_key, 'utf8'), 
    cert: fs.readFileSync(config.https.ssl_cert, 'utf8')
  }, webserver);

  httpsServer.listen(8443, function () {
    console.log('HTTPS listening on port 8443!');
  });
}


var httpServer = require('http').createServer(webserver);

httpServer.listen(3000, function () {
  console.log('HTTP listening on port 3000!');
});
