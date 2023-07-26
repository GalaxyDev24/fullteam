"use strict";

process.env.NODE_ENV = 'test';

var path = require('path');
var assert = require('assert');
var WebSocket = require('ws');
var comms = require('../../helpers/communication');
var EventEmitter = require('../../lib/event-emitter');
var eventEmitter = new EventEmitter();


var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
var chaiSubset = require('chai-subset'); 
var sinonChai = require("sinon-chai");
var Q = require("q");

chai.should();
chai.use(chaiAsPromised);
chai.use(chaiSubset);
chai.use(sinonChai);

global.chaiAsPromised = chaiAsPromised;
global.expect = chai.expect;
global.AssertionError = chai.AssertionError;
global.Assertion = chai.Assertion;
global.assert = chai.assert;

global.fulfilledPromise = Q.resolve;
global.rejectedPromise = Q.reject;
global.defer = Q.defer;
global.waitAll = Q.all;




var ws;
var socketUrl;
var callback = function(packet, done) {
  console.log(packet);
  done();
};

describe('WebSocket Server', function() {

  before(function() {
    // runs before all tests in this block
  });

  after(function() {
    // runs after all tests in this block
  });

  beforeEach(function(done) {
    // runs before each test in this block
    // socketUrl = 'ws://localhost:8001';
    socketUrl = 'ws://192.168.1.117:8080/socket_connect';
    ws = new WebSocket(socketUrl);
    var loginRequestID = ((new Date()).getTime()).toString().substring(4);
    ws.on('open', function open() {
      var data = {
        "LoginType": 0,
        "Email": "umar.bahadoor@gmail.com",
        "Password": "secret",
      };
      var buffer = comms.buildMessage(0, 0, loginRequestID, data)
      ws.send(buffer);
      eventEmitter.on('receivedMessage' + loginRequestID, () => {
        console.log('Login complete');
        done();
      });

    });

    ws.on('close', function close() {
      console.log('Connection closed...');
      eventEmitter.emit('connectionClosed');
    });

    ws.on('message', function(data, flags) {
      // flags.binary will be set if a binary data is received.
      // flags.masked will be set if the data was masked.
      if (!flags.binary) {
        return false;
      }
      var packet = comms.decodeMessage(data);
      eventEmitter.emit('receivedMessage' + packet.ID, packet);
    });
  });

  afterEach(function() {
    ws.close();
  });


  /* ---GET PROFILE--- CMD:40 */
  it('should return profile info', function(done) {

    var data = {
      "UserID": 1
    };
    
    var requestID = ((new Date()).getTime()).toString().substring(4);
    ws.send(comms.buildMessage(40, 0, requestID, data));
    eventEmitter.on('receivedMessage' + requestID, function(packet){
      console.log(packet);
      packet.Data.should.be.json;
      packet.Data.Success.should.equal(0);
      /*packet.Data.should.have.property('Email');*/
      packet.Data.should.have.property('Position');
      packet.Data.Position.should.be.a('number');
      packet.Data.should.have.property('FirstName');
      packet.Data.FirstName.should.be.a('string');
      packet.Data.FirstName.should.equal('x');
      packet.Data.should.have.property('LastName');
      packet.Data.LastName.should.be.a('string');
      packet.Data.LastName.should.equal('x');
      packet.Data.should.have.property('PictureURL');
      packet.Data.PictureURL.should.be.a('string');
      packet.Data.should.have.property('CoverPictureURL');
      packet.Data.CoverPictureURL.should.be.a('string');
      packet.Data.should.have.property('Birthday');
      packet.Data.Birthday.should.be.a('string');
      packet.Data.should.have.property('AveragePassing');
      packet.Data.AveragePassing.should.be.a('number');
      packet.Data.AveragePassing.should.equal(3);
      packet.Data.should.have.property('AverageShooting');
      packet.Data.AverageShooting.should.be.a('number');
      packet.Data.AverageShooting.should.equal(3);
      packet.Data.should.have.property('AverageFitness');
      packet.Data.AverageFitness.should.be.a('number');
      packet.Data.AverageFitness.should.equal(3);
      packet.Data.should.have.property('AverageReliability');
      packet.Data.AverageReliability.should.be.a('number');
      packet.Data.AverageReliability.should.equal(3);
      /*packet.Data.should.have.property('AverageRating');
      packet.Data.AverageRating.should.be.a('number');
      packet.Data.should.have.property('Locality');
      packet.Data.Locality.should.be.a('string');
      packet.Data.should.have.property('Country');
      packet.Data.Country.should.be.a('string');*/
      packet.Data.should.have.property('AlreadyRated');
      packet.Data.AlreadyRated.should.be.a('boolean').and.equal(false);
      packet.Data.should.have.property('CommentsAllowed');
      packet.Data.CommentsAllowed.should.be.a('boolean');     
      packet.Data.CommentsAllowed.should.equal(true);
      packet.Data.should.have.property('Feedbacks');
      packet.Data.Feedbacks.should.be.a('array');  
      packet.Data.Feedbacks[0].should.be.an('object');

      console.log('Get Profile complete');
      done();
    });

  });

  /* ---GET PROFILE--- NON EXISTANT ID - CMD:40 */
  it('should return an error message for non-existant ID (999999)', function(done) {

    var data = {
      "UserID": 999999
    };
    
    var requestID = ((new Date()).getTime()).toString().substring(4);
    ws.send(comms.buildMessage(40, 0, requestID, data));

    eventEmitter.on('receivedMessage' + requestID, function(packet){
      console.log(packet);
      packet.should.be.json;
      packet.Data.Success.should.equal(1);
      console.log('Get Profile complete');
      done();
    });

    eventEmitter.on('connectionClosed', function(){
      done();
    });

  });

  /* ---SEND SETTINGS--- CMD:30  */
  it('should send user settings', function(done) {

    var data = {
      "CommentsAllowed" : false,
      "NotificationsAllowed" : true,
      "Searchable" : true,
    };
    
    var requestID = ((new Date()).getTime()).toString().substring(4);
    ws.send(comms.buildMessage(30, 0, requestID, data));
    eventEmitter.on('receivedMessage' + requestID, function(packet){
      console.log(packet);
      console.log('User Send Settings complete');
      done(); 
    });

  });

  /* ---GET SETTINGS--- CMD:35  */
  it('should return user settings', function(done) {

    var data = {};
    
    var requestID = ((new Date()).getTime()).toString().substring(4);
    ws.send(comms.buildMessage(35, 0, requestID, data));
    eventEmitter.on('receivedMessage' + requestID, function(packet){
      console.log(packet);
      packet.should.be.json;
      packet.should.have.property('Command');
      packet.should.have.property('Options');
      packet.should.have.property('ID');
      packet.should.have.property('DataLength');
      packet.should.have.property('Data');
      packet.Data.should.be.json;
      packet.Data.should.have.property('Success');
      packet.Data.Success.should.equal(0);
      packet.Data.should.have.property('CommentsAllowed');
      packet.Data.CommentsAllowed.should.be.a('boolean');
      packet.Data.CommentsAllowed.should.be.false;
      packet.Data.should.have.property('NotificationsAllowed');
      packet.Data.NotificationsAllowed.should.be.a('boolean');
      packet.Data.NotificationsAllowed.should.be.true;
      packet.Data.should.have.property('Searchable');
      packet.Data.Searchable.should.be.a('boolean');
      packet.Data.Searchable.should.be.true;
      console.log('User Get Settings complete');
      done(); 
    });

  });

  /* ---UPDATE USER DATA--- CMD:60 */
  it.only('should update user data', function(done) {

    var data = {
      "FirstName" : 'Umar',
      "LastName" : 'Bahadoor',
      "Email" : 'umar.bahadoor@gmail.com',
      /*"Birthday" : '19091970',
      "PictureURL" : true,
      "CoverPictureURL" : true,*/
    };
    
    var requestID = ((new Date()).getTime()).toString().substring(4);
    ws.send(comms.buildMessage(60, 0, requestID, data));
    eventEmitter.on('receivedMessage' + requestID, function(packet){
      console.log(packet);
      console.log('Update User Data complete');
      done(); 
    });

  });

  /* ---GET USER DATA--- CMD:50 */
  it.only('should return user data', function(done) {

    var data = {};
    
    var requestID = ((new Date()).getTime()).toString().substring(4);
    ws.send(comms.buildMessage(50, 0, requestID, data));
    eventEmitter.on('receivedMessage' + requestID, function(packet){
      console.log(packet);
      packet.should.be.json;
      packet.should.have.property('Command');
      packet.should.have.property('Options');
      packet.should.have.property('ID');
      packet.should.have.property('DataLength');
      packet.should.have.property('Data');
      packet.Data.should.be.json;
      packet.Data.Success.should.equal(0);
      packet.Data.should.have.property('Email');
      packet.Data.Email.should.be.a('string');
      packet.Data.Email.should.equal('umar.bahadoor@gmail.com')
      packet.Data.should.have.property('Birthday');
      packet.Data.Birthday.should.be.a('string');
      packet.Data.should.have.property('PictureURL');
      packet.Data.PictureURL.should.be.a('string');
      console.log('Get User Data complete');
      done(); 
    });

  });


});