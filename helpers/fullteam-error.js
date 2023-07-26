"use strict";

/* jshint esversion: 6 */

class FullteamError extends Error {
  constructor(message, errorObject) {
    super(message);
    this.reason = errorObject;
  }
}

module.exports = FullteamError;