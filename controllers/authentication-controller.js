var q = require('q'),
  knex = require('lib/knex'),
  config = require('config'),
  async = require('async'),
  hasher = require('helpers/password-hasher'),
  randtoken = require('rand-token'),
  validate = require("validate.js"),
  Controller = require('controllers/controller'),
  AuthService = require('services/authentication-service'),
  FB = require('fb'),
  fb;

var loginRequestConstraints = {
  LoginType: {
    presence: {
      message: "is required"
    },
    numericality: {
      onlyInteger: true
    }
  }
};

function getConnectionKey(request) {
  var defaultKey = false;

  if(typeof request === 'undefined') {
    return defaultKey;
  }

  if(typeof request.connection === 'undefined') {
    return defaultKey;
  }

  if(typeof request.connection.key === 'undefined') {
    return defaultKey;
  }

  return request.connection.key;
}


function AuthenticationController() {
  // super
  var self = this;
  var ctrl = new Controller(self);

  self.login = function(request, response, app) {

    var response = {};
    var data = request.data;
    var deferred = q.defer();
    var userID = null;

    async.waterfall([

      // Check if fields are valid
      function(callback) {

        var errors = validate(data, loginRequestConstraints);

        if (!errors) {
          return callback(null);
        }

        return ctrl.errorCallback(callback, 1, "Invalid Parameters", errors);
      },

      // Facebook Login
      function(callback) {
        if (data.LoginType == 0) {
          return callback(null);
        }

        fb = new FB.Facebook(config.facebook);

        var params = {
          fields: ['id', 'picture'],
          access_token: data.FacebookAccessToken
        };

        FB.api('me', params, function(res) {
          if (!res || res.error) {
            console.log(!res ? 'error occurred' : res.error);
            return callback({
              'success': 1,
              'Description': "OAuth Exception (Probably wrong access token)."
            });
          }

          var facebookID = res.id;

          console.log("facebookID: " + facebookID);

          knex.table('user')
              .innerJoin('facebook_ids', 'user.id', '=', 'facebook_ids.user_id')
              .where('facebook_ids.facebook_id', '=', facebookID)
              .first()
              .then(function(result) {
                if (typeof result === 'undefined') {
                  return callback({
                    'success': 1,
                    'Description': "Cannot find user with this facebook account."
                  });
                }

                userID = result.id;
                return callback(null);

              }, function(error) {
                return callback(error);
              });

        });
      },

      // Normal Login with token
      function(callback) {

        if (userID) {
          return callback(null);
        }

        if (data.LoginType == 1) {
          return callback(null);
        }

        if (typeof data.LoginToken === 'undefined' || !data.LoginToken) {
          return callback(null);
        }

        knex.table('user')
            .innerJoin('login_tokens', 'user.id', '=', 'login_tokens.user_id')
            .where('login_tokens.login_token', '=', data.LoginToken)
            .first()
            .then(function(result) {
              if (typeof result === 'undefined') {
                return callback({
                  'success': 1,
                  'Description': "Token invalid."
                });
              }

              userID = result.id;
              return callback(null);

            }, function(error) {
              return callback(error);
            });

      },

      // Normal Login with username/password
      function(callback) {
        
        if (userID) {
          return callback(null);
        }

        AuthService.checkCredentials(data.Email, data.Password).then(
          function(user) {
            userID = user.id;
            return callback(null);
          },
          function(err) {
            console.log('err');
            console.log(err);
            return callback(err);
          });
      },

      // Create the user...
      function(callback) {

        var key = getConnectionKey(request);
        if(key) {
          app.authenticate(key, userID);
        }
        

        if (data.LoginToken) {
          
          response = {
            success: 0,
            UserID: userID,
            LoginToken: data.LoginToken
          };
          
          return callback(null);

        }
              
              

        var token = null;

        knex.table('user')
            .innerJoin('login_tokens', 'user.id', '=', 'login_tokens.user_id')
            .where('login_tokens.user_id', '=', userID)
            .first()
            .then(function(result) {
              if(typeof result === 'undefined') {
                token = randtoken.generate(60);
                knex.table('login_tokens').insert({
                    'user_id': userID,
                    'login_token': token
                }).then(function(result){
                  console.log('Created login token:' + token);
                  response = {
                    success: 0,
                    UserID: userID,
                    LoginToken: token
                  };
                  return callback(null);
                }, function(err) {
                  return ctrl.errorCallback(callback, 1, "Could not create login token", err);
                });
              } else {
                token = result.login_token; 
                response = {
                  success: 0,
                  UserID: userID,
                  LoginToken: token
                };
                return callback(null);
              }
              
              

            }, function(error) {
              console.log(error);

              return callback({
                'success': 1,
                'Description': "Cannot find login token",
                'Description': error,
              });

            });

      },

      // Returns the response..
      function(callback) {
        return callback(null, response);
      },


    ], ctrl.asyncCallback(deferred));

    return deferred.promise;

  };

}

// Returns 
module.exports = new AuthenticationController();
