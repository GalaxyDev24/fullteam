require('app-module-path').addPath(__dirname);
require('dotenv').config();
var express = require('express');
var fs = require('fs');
var config = require('config');

var webserver = express();

webserver.all('/', function (req, res) {
  console.log('Request received.');
  const spawn = require('child_process').spawn;
  const ls = spawn('bash', ['scripts/gitpull.sh']);
  
  ls.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
  });

  ls.stderr.on('data', (data) => {
    console.log(`stderr: ${data}`);
  });

  ls.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
    res.send(JSON.stringify({"success":true}));
  });
});

var httpsServer = require('https').createServer({
    key: fs.readFileSync(config.ws.ssl_key, 'utf8'), 
    cert: fs.readFileSync(config.ws.ssl_cert, 'utf8')
}, webserver);

httpsServer.listen(8445, function () {
  console.log('HTTPS listening on port 8445!');
});


var httpServer = require('http').createServer(webserver);
httpServer.listen(3005, function () {
  console.log('HTTP listening on port 3005!');
});
