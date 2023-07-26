"use strict";

/* jshint esversion:6 */

var logger = require('helpers/logger');

function __sanitizeResponseKeys(result) {
  // console.log(result);
  if(typeof result.Success === 'undefined') {
    if (typeof result.success == 'undefined') {
      result.Success = 0;
    }
    else {
      result.Success = result.success;
    }
  }

  if (typeof result.Description === 'undefined') {
    if (typeof result.description == 'undefined') {
      result.Description = null;
    }
    else {
      result.Description = result.description;
    }
  }

  if (typeof result.success !== 'undefined') {
    delete result.success;
  }
  if (typeof result.description !== 'undefined') {
    delete result.description;
  }

  return result;

}

class Controller {

  constructor(controller) {
    this.ctrl = controller;
  }

  

  asyncCallback(deferred) {
    return function(err, result) {
      if (err) {
        //console.error(err);
        deferred.reject(__sanitizeResponseKeys(err));
        return;
      }

      deferred.resolve(__sanitizeResponseKeys(result));

    };
  }

  errorCallback(callback, code, description, errors) {
    if (typeof code === 'undefined') {
      return callback(null);
    }

    if (!String(code).length) {
      return callback(null);
    }
    
    logger.error({
      'code': code,
      'description': description,
      'errors': errors
    });

    var err = {
      'Success': code,
      'Description': description
    };

    if (typeof errors !== 'undefined') {
      err.errors = errors;
    }
    
    return callback(err);
  }
}

module.exports = Controller;
