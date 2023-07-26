var knex                = require('lib/knex'),
    q                   = require('q'),
    config              = require('config'),
    async               = require('async'),
    util                = require('util'),
    validator           = require('node-validator'),
    validate            = require("validate.js"),
    log                 = require('helpers/logger'),
    moment              = require('moment'),
    crypto              = require('crypto'),
    hasher              = require('helpers/password-hasher'),
    suid                = require('rand-token').suid,
    FB                  = require('fb'),
    User                = require('models/user'),
    RegistrationService = require('services/registration-service'),
    firebase            = require('helpers/firebase'),
    Controller          = require('controllers/controller'),
    fb
;
var Twitter = require('twitter');


var registrationRequestConstraints = {
    RegistrationType: {
        presence: {
            message: "is required"
        },
        numericality: {
            onlyInteger: true
        }
    },
    Email: {
        presence: {
            message: "is required"
        }
    },
    GCMID: function(value, attributes, attributeName, options, constraints) {
        if (validate.isDefined(value)) {
            return null;
        }
        return {
            presence: {
                message: "is required"
            }
        };
    },
    Gender: {
        presence: {
            message: "is required"
        },
        numericality: {
            onlyInteger: true
        }
    },
    Positions: {
        presence: {
            message: "is required"
        }
    }
};

function RegistrationController() {
    // super
    var ctrl = new Controller(this);

    this.register = function(packet) {
        var data = packet.data;
        var deferred = q.defer();

        async.waterfall([
            // Check if fields are valid
            function(callback) {
                var errors = validate(data, registrationRequestConstraints);
                if (packet.data.Gender != 0 && 
                    packet.data.Gender != 1 &&
                    packet.data.Gender != 2 &&
                    packet.data.Gender != 9) {
                    errors = "Bad gender val";
                }
                if (!errors) {
                    if (data.Positions.length == 0 || data.Positions.length > 4) {
                        return ctrl.errorCallback(callback, 1, "Bad amount of positions specified");
                    }
                    return callback(null);
                }
                return ctrl.errorCallback(callback, 1, "Invalid Parameters", errors);
            },
            // Check if email address exists.
            function(callback) {
                RegistrationService.emailExists(data.Email).then(
                    function(exists) {
                        var err = null;
                        if (exists) {
                            err = {
                                'Success': 2,
                                'Description': "User with this email already exists."
                            };
                        }
                        return callback(err);
                    },
                    function(err) {
                        return callback(err);
                    }
                );
            },

            // Check facebook stuff...
            function(callback) {
                if (data.RegistrationType != 1) {
                    return callback(null);
                }

                if (!data.hasOwnProperty("FacebookAccessToken")) {
                    return ctrl.errorCallback(callback, 1, "Invalid Parameters");
                }

                // Facebook Login
                fb = new FB.Facebook(config.facebook);
                var params = { 
                    fields: [
                        'id',
                        'picture.width(512).height(512)', 
                        'birthday', 
                        'first_name', 
                        'last_name', 
                    ], 
                    access_token: data.FacebookAccessToken
                };

                FB.api('me', params, function(res) {
                    if (!res || res.error) {
                        return callback({ 
                            'Success': 1,
                            'Description': "OAuth Exception (Probably wrong access token)."
                        });
                    }

                    data.FacebookID = res.id;
                    data.PictureUrl = res.picture.data.url;
                    if (res.birthday && !data.Birthday) {
                        data.Birthday = moment(res.birthday, 'MM/DD/YYYY').format('DDMMYYYY');  
                    }

                    data.FirstName = res.first_name;
                    data.LastName = res.last_name;
                    return callback(null);
                });
            },

            // Check twitter stuff
            function(callback) {
                if (data.RegistrationType != 2) {
                    return callback(null);
                }

                if (!data.hasOwnProperty("TwitterAccessToken") ||
                    !data.hasOwnProperty("TwitterAccessTokenSecret")) {
                    return ctrl.errorCallback(callback, 1, "Invalid Parameters");
                }

                var client = new Twitter({
                    consumer_key: 'vPzlRBkV6LMfGen1WVr058zT9',
                    consumer_secret: 'LCF2S7sXyFqvaj6uj4LVsEeTZXfTCK3LU73lF3epPp2LwwVOOD',
                    access_token_key: data.TwitterAccessToken,
                    access_token_secret: data.TwitterAccessTokenSecret,
                });

                // Get name & picture URL
                client
                    .get("account/verify_credentials", {skip_status: true},
                        function(err, response) {
                            if (err) {
                                return ctrl.errorCallback(callback, 1, "Twitter API error");
                            }
                            var name = response.name;
                            var spaceIndex = name.indexOf(" ");
                            if (spaceIndex == -1) {
                                data.FirstName = name;
                                data.LastName = "";
                            }
                            else {
                                data.FirstName = name.slice(0, spaceIndex);
                                data.LastName = name.slice(spaceIndex+1, name.length);
                            }
                            data.PictureUrl = response.profile_image_url_https;
                            callback(null);
                        });
            },

            // Calculate age
            function(callback) {
                var birtdate = moment(data.Birthday, "DDMMYYYY");
                if (!birtdate.isValid()) {
                    return ctrl.errorCallback(callback, 1, "Birthday bad format. " + data.Birthday + "does not match format DDMMYYYY");
                }
                data.Age = moment().diff(birtdate, 'years');
                callback(null);
            },


            // Create image...
            function(callback) {

                if (typeof data.PictureData === 'undefined' || !data.PictureData ) {
                    return callback(null);
                }

                var fs                  = require('fs');
                var img                 = data.PictureData;
                var sanitizedImageData  = img.replace(/^data:image\/\w+;base64,/, "");
                var buf                 = new Buffer(sanitizedImageData, 'base64');
                var filename            = suid(32) + '.jpg';

                fs.writeFile('public/UserUploads/ProfilePictures/' + filename, buf, function(err) {

                    if(err) {
                        return callback(err);
                    }

                    data.PictureUrl = config.baseUrl + 'UserUploads/ProfilePictures/' + filename;
                    callback(null);

                });
            },

            // Generate password hash
            function(callback) {
                if (!data.hasOwnProperty('Password')) {
                    data.Password = "";
                }
                hasher.hashPassword(data.Password, function(err, hash) {
                    if (err) {
                        return callback(err);
                    }

                    return callback(null, hash.toString('hex'));
                });
            },

            function (password, callback) {

                if(typeof data.PictureUrl === 'undefined' || !data.PictureUrl) {
                    data.PictureUrl = config.baseUrl + '/UserUploads/ProfilePictures/DefaultPicture.jpg';
                }

                if (typeof data.Country === 'undefined' || data.Country == null) { data.Country = ''; }
                if (typeof data.Locality === 'undefined' || data.Country == null) { data.Locality = ''; }
                if (typeof data.Lat === 'undefined' || data.Country == null) { data.Lat = 0.0; }
                if (typeof data.Lon === 'undefined' || data.Country == null) { data.Lon = 0.0; }
                var userObject = {
                    'email': data.Email,
                    'password': password,
                    'firstName': data.FirstName,
                    'lastName': data.LastName,
                    'pictureURL': data.PictureUrl,
                    'coverPictureURL': '',
                    'birthday': data.Birthday,
                    'GCMIDs': [],
                    'gender': data.Gender,
                    'age': data.Age,
                    'mobile_number': data.MobileNumber,
                    'positions': data.Positions,
                    'lat': data.Lat,
                    'lon': data.Lon,
                    'locality': data.Locality,
                    'country': data.Country,
                };

                if(data.GCMID) {
                    userObject.GCMIDs.push(data.GCMID);
                    firebase.addFCMToTopic([data.GCMID], 'twitter')
                    .catch(function(err) {
                        log.error(err);
                    });
                }

                if(typeof data.FacebookID !== 'undefined' && data.FacebookID) {
                    userObject.facebookID = data.FacebookID;
                }


                RegistrationService.registerUser(userObject).then(
                    function() {
                        callback(null, {
                            'Success': 0,
                            'Description': null
                        });
                    },
                    function(err) {
                        callback({
                            'Success': 1,
                            'Description': "An unkown error has occurred whilst inserting the user data.",
                            'error': err
                        });
                    }
                );
            }

                    ], ctrl.asyncCallback(deferred));

        return deferred.promise;
    };

    return this;
}

// Returns 
module.exports = new RegistrationController();
