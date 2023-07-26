"use strict";
var knex = require('lib/knex');
var NodeMailer = require('nodemailer');
var q = require('q');
var fs = require('fs');
var config = require('config');

class ResetPasswordService {

    static saveEmail(dataObject) {
        if (typeof dataObject === 'undefined') {
            return false;
        }

        return knex('reset_password_tokens').insert(dataObject, 'id');
    }

    static checkEmailIfExist(email) {
        if (typeof email === 'undefined') {
            return false;
        }

        return knex.from('user').where('email', email).first();
    }

    static prepareEmailTemplate(token, email) {
        var deferred = q.defer();
        var file = 'public/admin/html-component/reset-password.html';

        fs.readFile(file, 'utf8', function (err, data) {
          if (err) {
            deferred.reject(error);
            return;
          }

          // localhost/fullteam-webapp/app/#/auth/reset-password/:token

          var emailAndToken = token + '&' + email;
          var link = config.baseUrl + 'app/#/auth/reset-password/' + emailAndToken;

          var result = data.replace(/:linkWithToken/g, link);

          deferred.resolve(result);
        });

        return deferred.promise;
    }

    static sendEmail(token, to) {
        var deferred = q.defer();

        var transporter = NodeMailer.createTransport(({
            pool: true,
            host: 'ds-153.gws-technologies.com',
            port: 465,
            secure: true,
            auth: {
                user: 'noreply@uny.cc',
                pass: 'wvp7R4Puq9V0VLj4'
            },
            // use up to 5 parallel connections, default is 5
            maxConnections: 5,
            // do not send more than 10 messages per connection, default is 100
            maxMessages: 10,
            // no not send more than 5 messages in a second, default is no limit
            rateLimit: 5
        }));

        this.prepareEmailTemplate(token, to).then(function(messageHtml) {
            // setup email data with unicode symbols
            var mailOptions = {
                from: '"Fullteam" <noreply@uny.cc>', // sender address
                to: to, // list of receivers
                subject: "Fullteam Forgotten Password", // Subject line
                html: messageHtml // html body
            };

            // send mail with defined transport object
            transporter.sendMail(mailOptions, function(error, info){
                console.log('info');

                if (error) {
                    console.log('error');
                    console.log(error);
                    deferred.reject(error);
                    return;
                }
                
                console.log('Message %s sent: %s', info.messageId, info.response);
                deferred.resolve(result);
            });

            return deferred.promise;
        });

        // return deferred.promise;
    }

    static checkEmailAndTokenIfExists(email, token) {
        return knex
                .from('reset_password_tokens')
                .where('email', email)
                .where('token', token)
                .first();
    }

    static getUserByEmail(email) {
        return knex.from('user').where('email', email).first();
    }

    static updatePassword(userID, password) {
        return knex('user')
                .where('id', userID)
                .update({
                    pass: password
                });
    }

    static deleteResetToken(email, token) {
        return knex('reset_password_tokens')
                .where('email', email)
                .where('token', token)
                .delete();
    }
}

module.exports = ResetPasswordService;