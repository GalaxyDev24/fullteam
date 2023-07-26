"use strict";

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
