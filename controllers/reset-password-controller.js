let Controller = require('controllers/controller');
let suid = require('rand-token').suid;
let q = require('q');
let Nodemailer = require('nodemailer');
let ResetPasswordService = require('services/reset-password-service');
let moment = require('moment');
let validate = require("validate.js");
let async = require('async');
let hasher = require('helpers/password-hasher');
let knex = require('lib/knex');


function ResetPasswordController() {
  // super
  var ctrl = new Controller(this);

  this.sendEmailResetPassword = function(packet) {
    var data = packet.data;
    var deferred = q.defer();
    var dataInsert = {};

    var resetPasswordRequestConstraints = {
      Email: {
        presence: {
          message: "is required"
        }
      }
    };

    async.waterfall([
      // Check if fields are valid
      function(callback) {
        var errors = validate(data, resetPasswordRequestConstraints);
        
        if (!errors) {
          return callback(null);
        }

        return ctrl.errorCallback(callback, 1, "Invalid Parameters", errors);
      },

      // Check if mail exist in database
      function(callback) {
        var mailExist = false;
        ResetPasswordService.checkEmailIfExist(data.Email).then(function(user) {
            if (typeof user === 'undefined') {
                return callback(null, mailExist);
            }

            return callback(null, true);
        })
        .catch(function(err) {
            console.log(err);
            return ctrl.errorCallback(callback, 1, "Error while checking email address");
        });
      },

      // Save email
      function(mailExist, callback) {
        if (!mailExist) {
          return callback(null, mailExist);
        }

        dataInsert.email = data.Email;
        dataInsert.token = suid(64);
        dataInsert.expiry_date = moment().add({d: 1}).format("YYYY-MM-DD HH:mm:ss");

        ResetPasswordService.saveEmail(dataInsert).then(function(id) {
            if (!id) {
                return ctrl.errorCallback(callback, 2, "Error while saving user email address");
            }

            return callback(null, mailExist);
        })
        .catch(function(err) {
            console.log(err);
            return ctrl.errorCallback(callback, 1, "Error while saving user email address");
        });
      },

      // Send email to user
      function(mailExist, callback) {
        var message = 'An e-mail has been sent to ' + data.Email;
        if (!mailExist) {
            return callback(null, {
              'Success': 0,
              'Description': null,
              'Message': message
            });
        }
        
        ResetPasswordService.sendEmail(dataInsert.token, data.Email);
        return callback(null, {
          'Success': 0,
          'Description': null,
          'Message': message
        });
      }
    ], ctrl.asyncCallback(deferred));

    return deferred.promise;
  };

  this.isResetPasswordURLValid = function(packet) {
    var data = packet.data;
    var deferred = q.defer();
    // var userObj = {};
    var message = '';

    var isResetPasswordURLValidRequestConstraints = {
      Email: {
        presence: {
          message: "is required"
        }
      },
      ResetToken: {
        presence: {
          message: "is required"
        }
      }
    };

    async.waterfall([
      // Check if fields are valid
      function(callback) {
        var errors = validate(data, isResetPasswordURLValidRequestConstraints);
        
        if (!errors) {
          return callback(null);
        }

        return ctrl.errorCallback(callback, 1, "Invalid Parameters", errors);
      },

      // Check user email if exists
      function(callback) {
        ResetPasswordService.getUserByEmail(data.Email).then(function(user) {
          if (typeof user === 'undefined' || !user) {
            return ctrl.errorCallback(callback, 2, "This URL has expired and is no longer valid");
          }

          return callback(null);
        })
        .catch(function(err) {
          return ctrl.errorCallback(callback, 4, "Error while retrieving email");
        });
      },

      // Check Email and Token
      function(callback) {
        ResetPasswordService.checkEmailAndTokenIfExists(data.Email, data.ResetToken).then(function(resetTokenResult) {
          if (typeof resetTokenResult === 'undefined' || !resetTokenResult) {
            return ctrl.errorCallback(callback, 2, "This URL has expired and is no longer valid");
          }

          var now = moment().format('YYYY-MM-DD HH:mm:ss');
          var expiryDate = moment(resetTokenResult.expiry_date).format('YYYY-MM-DD HH:mm:ss');
          if (now > expiryDate) {
            return ctrl.errorCallback(callback, 3, "This URL has expired and is no longer valid");
          }

          return callback(null, {'Success': 0, 'Description': null});
        })
        .catch(function(err) {
          return ctrl.errorCallback(callback, 4, "Error while checking user email and reset token");
        });
      }

    ], ctrl.asyncCallback(deferred));

    return deferred.promise;
  };

  this.resetUserPassword = function(packet) {
    var data = packet.data;
    var deferred = q.defer();
    var userObj = {};

    var resetUserPasswordRequestConstraints = {
      Email: {
        presence: {
          message: "is required"
        }
      },
      ResetToken: {
        presence: {
          message: "is required"
        }
      },
      Password: {
        presence: {
          message: "is required"
        }
      }
    };

    async.waterfall([
      // Check if fields are valid
      function(callback) {
        var errors = validate(data, resetUserPasswordRequestConstraints);
        if (!errors) {
          return callback(null);
        }

        return ctrl.errorCallback(callback, 1, "Invalid Parameters", errors);
      },

      // Check Email and Token
      function(callback) {
        ResetPasswordService.checkEmailAndTokenIfExists(data.Email, data.ResetToken).then(function(resetTokenResult) {
          if (typeof resetTokenResult === 'undefined' || !resetTokenResult) {
            return ctrl.errorCallback(callback, 2, "This URL has expired and is no longer valid");
          }

          var now = moment().format('YYYY-MM-DD HH:mm:ss');
          var expiryDate = moment(resetTokenResult.expiry_date).format('YYYY-MM-DD HH:mm:ss');
          if (now > expiryDate) {
            return ctrl.errorCallback(callback, 3, "This URL has expired and is no longer valid");
          }

          return callback(null);
        })
        .catch(function(err) {
          console.log(err);
          return ctrl.errorCallback(callback, 4, "Error while checking user email and reset token");
        });
      },

      // Get user email
      function(callback) {
        ResetPasswordService.getUserByEmail(data.Email).then(function(user) {
          if (typeof user === 'undefined' || !user) {
            return ctrl.errorCallback(callback, 2, "This URL has expired and is no longer valid");
          }

          userObj = user;

          return callback(null);
        })
        .catch(function(err) {
          console.log(err);
          return ctrl.errorCallback(callback, 4, "Error while retrieving email");
        });
      },

      // Hash new password
      function(callback) {
        hasher.hashPassword(data.Password, function(err, hash) {
          if (err) {
            return callback(err);
          }

          return callback(null, hash.toString('hex'));
        });
      },
      
      // Update Password
      function(password, callback) {
        if (!password) {
          return callback(null, false);
        }

        ResetPasswordService.updatePassword(userObj.id, password).then(function(result) {
          return callback(null);
        })
        .catch(function(err) {
          console.log(err);
          return ctrl.errorCallback(callback, 1, "Error while updating new password");
        });
      },

      // Delete email and token
      function(callback) {
        var message = 'Password has been updated';
        ResetPasswordService.deleteResetToken(data.Email, data.ResetToken).then(function(res){
          return callback(null, {
            'Success': 0,
            'Description': null,
            'Message': message
          });
        })
        .catch(function(err) {
          console.log(err);
          return ctrl.errorCallback(callback, 1, "Error while deleting reset password token");
        });
      }
    ], ctrl.asyncCallback(deferred));

    return deferred.promise;
  };

  return this;
}

// Returns 
module.exports = new ResetPasswordController();