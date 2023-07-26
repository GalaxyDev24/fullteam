var _ = require('lodash');
var AuthService = require('services/authentication-service');

module.exports = function (req, res, next) {
  var authorization = req.get('authorization');
  if (_.startsWith(authorization, 'LoginToken ')) {
    var loginToken = authorization.replace('LoginToken ', '');
    console.log(loginToken);
    return AuthService.checkLoginToken(loginToken).then(function(userID){
      req.userID = userID;
      next();
    }, function(){
      next();
    });
  }
  
  next();
};