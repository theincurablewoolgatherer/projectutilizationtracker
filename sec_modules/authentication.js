// load all the things we need
var LocalStrategy = require('passport-local').Strategy;

// load up the user model
var User = require('../app/models/User');

var activeDirectory = require('activedirectory');

var constants = require('../app/utils/constants');

// expose this function to our app using module.exports
module.exports = function (passport) {
    var TAG = "[authentication.js] ";

    // =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session

    // used to serialize the user for the session
    passport.serializeUser(function (user, done) {
        done(null, user.id);
    });

    // used to deserialize the user
    passport.deserializeUser(function (id, done) {
        User.findById(id, function (err, user) {
            done(err, user);
        });
    });

    // =========================================================================
    // LOCAL LOGIN ============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    // Authentication Logic
    passport.use(new LocalStrategy(function (username, password, done) {
        // var dn = 'uid=' + username + ',ou=users,dc=srph,dc=samsung,dc=net';
        // var ad = new activeDirectory({
        //     url: 'ldap://107.105.134.72:389',  
        //     baseDN: dn,
        //     username: 'uid=' + username,
        //     password: password
        // });

        // ad.authenticate(dn, password, function (err, user) {
            // if (err) {
            //     console.log(TAG + 'Error Authenticating User: ' + username);
            //     // return;
            //     return done(err);
            // }
            // // Auth Check Logic
            // if (!user) {
            //     console.log(TAG + 'Error Authenticating User: ' + username);
            //     return done(null, false, {
            //         message: 'Incorrect mySingle Id or password.'
            //     });
            // } else {
                User.findOne({
                    username: username
                }, function (err, user) {
                    if (err) {
                        return done(err);
                    }
                    // First time login of User
                    if (!user) {
                        
                        // Create user
                        var _usertype = constants.USERTYPE_DEVELOPER;
                        User.find(function (err, users) {
                            if(!users || users.length == 0){
                                // Create Admin User
                                _usertype = constants.USERTYPE_PROJECT_MANAGER;
                            }
                            console.log(TAG + "Create User: " + _usertype + " " + username);

                            User.create({
                                username: username,
                                usertype: _usertype
                            }, function (err, user) {
                                if (err)
                                    res.send(err);
                                // return user after saving
                                return done(null, user);
                            });
                        });
                        
                    } else {
                        console.log(TAG + "Login Succeeded: " + user.username);
                        return done(null, user);
                    }
                });
            // }
        // });
    }));
};