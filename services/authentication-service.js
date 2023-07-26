var knex = require('lib/knex'),
  q = require('q'),
  async = require('async'),
  hasher = require('helpers/password-hasher'),
  randtoken = require('rand-token');

module.exports = (function() {

  function checkCredentials(email, password) {

    var deferred = q.defer();

    async.waterfall([
      function(callback) {


        if (!email) {
          return callback({
            'success': 1,
            'description': "Invalid Email."
          });
        }

        if (!password) {
          return callback({
            'success': 1,
            'description': "Invalid Password."
          });
        }

        knex.table('user').where('email', '=', email).first().then(function(result) {
          if (typeof result === 'undefined') {
            return callback({
              'success': 1,
              'description': "User email not found in database"
            });
          }

          return callback(null, result);

        }, function(error) {
          return callback(error);
        });

      },

      function(user, callback) {
        var combined = new Buffer(user.pass, 'hex');
        console.log(password);
        console.log(user.pass);
        hasher.verifyPassword(password, combined, function(err, valid) {

          if (err || !valid) {
            return callback({
              'success': 1,
              'description': "Password incorrect."
            });
          }

          return callback(null, user);
        });
      },

      function(user, callback) {

        knex.table('user').innerJoin('login_tokens', 'user.id', '=', 'login_tokens.user_id').where('user.id', '=', user.id).first().then(function(result) {

          if (typeof result !== 'undefined') {
            return callback(null, user, result.login_token);
          }

          return callback(null, user, null);

        }, function(error) {
          return callback(error);
        });

      },

      function(user, loginToken, callback) {

        if (loginToken) {
          return callback(null, user, loginToken);
        }

        token = randtoken.generate(60);

        var tokenInfo = {
          user_id: user.id,
          login_token: token
        };

        knex('login_tokens').insert(tokenInfo, 'id').then(function(userID) {
          return callback(null, user, token);
        }, function(err) {
          return callback(err);
        });

      },

    ], function(err, result) {
      if (err) {
        deferred.reject(err);
        return;
      }
      
      deferred.resolve(result);
    });

    return deferred.promise;
  };

  function checkLoginToken(token) {
    var userID;
    var deferred = q.defer();
    knex.table('login_tokens')
        .where('login_tokens.login_token', '=', token)
        .first()
        .then(function(result) {
          if (typeof result === 'undefined') {
            return deferred.reject(false);
          }
          return deferred.resolve(result.user_id);
        }, function(error) {
          return deferred.reject(error);
        });

    return deferred.promise;

  }

  return {
    checkCredentials: checkCredentials,
    checkLoginToken: checkLoginToken,
  };

})();