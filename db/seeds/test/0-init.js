var appPath = __dirname + '/../../../';
require('dotenv').config();
require('app-module-path').addPath(appPath);
console.log('Base Module Path: ' + appPath);

exports.seed = function(knex, Promise) {

};
