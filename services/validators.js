var log = require('helpers/logger');

function isBoolean() {
    this.validate = function(value, onError) {
      if (typeof(value) === 'boolean') {
          return;
      }
      else {
          onError('Value is not boolean', null, null);
      }
    }
    return this;
}

module.exports = {
  isBoolean: new isBoolean()
};
