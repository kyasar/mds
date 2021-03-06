/**
 * Created by kadir on 02.07.2015.
 */
var UserModel    = require('../libs/mongoose').UserModel;
var log     = require('../libs/log')(module);
var config  = require('../libs/config');
var express = require('express');
var jwt     = require('jsonwebtoken'); // used to create, sign, and verify tokens
var router  = express.Router();

router.get('/',function(req,res){
    res.sendfile('views/signup.html');
});

var nodemailer = require("nodemailer");
/*
 Here we are configuring our SMTP Server details.
 STMP is mail server which is responsible for sending and recieving email.
 */
var smtpMailConn = { //= nodemailer.createTransport("SMTP", {
    host: 'mds1.markod.net',
    port: 587,
//    secure: true,
//    ssl: true,
//    use_authentication: true,
    auth: {
        user: 'info@markod.net',
        pass: 'infomds2015'
    } /*
     service: "Gmail",
     auth: {
     user: "kyasar07@gmail.com",
     pass: "Peijreby007"
     } */
//)};
};

var smtpTransport = nodemailer.createTransport(smtpMailConn);
var mailOptions, host, link;

/*
    Email verify method
 */
router.get('/verify', function(req, res) {
    //console.log(req.protocol + "://" + req.get('host'));
    if (!req.query.id || !req.query.token) {
        log.info("No Id or Token specified.");
        return res.send({status: 'fail', error : "No Id or Token specified."});
    }

    console.log("Email Verify: Searching for user id: ", req.query.id);

    UserModel.findById(req.query.id, function (err, user) {
        if (user) {
            log.info("User found: ", user._id.toString());

            jwt.verify(req.query.token, config.get('secret'), function(err, decoded) {
                if (err) {
                    log.info("Token NOT verified !!");

                    UserModel.findByIdAndRemove(req.query.id, function(err) {
                        if (!err) {
                            log.info("User deleted to get new token to be verified.");
                        } else {
                            log.error("User could not be deleted! Fatal Error.");
                        }
                        return res.send({status: 'fail', error: 'Token not verified. Timed out.'});
                    });

                } else {
                    log.info("Token verified. OK.");

                    UserModel.findByIdAndUpdate(req.query.id,
                        { $set : { 'verification' : true }, $unset : { 'verifyToken' : "" } },
                        { new: true, upsert : false },  // Return updated object, Do not insert if not exists
                        function (err, user) {
                            if (!err) {
                                log.info("User Verified.");
                                return res.send({ status: 'OK', user : user });
                            } else {
                                console.log(err);
                                if(err.name == 'ValidationError') {
                                    res.statusCode = 400;
                                    res.send({status: 'fail', error: 'Validation error' });
                                } else {
                                    res.statusCode = 500;
                                    res.send({status: 'fail', error: 'Server error' });
                                }
                                log.error('Internal error(%d): %s', res.statusCode, err.message);
                            }
                        });
                }
            });
        } else if (!user) {
            log.info("User not found !!");
            return res.send({status: 'fail', error: 'User not found.'});
        }
    });
});

// ---------------------------------------------------------
// route middleware to authenticate and check API key
// a middleware with no mount path; gets executed for every request to the app
// ---------------------------------------------------------
router.use(function(req, res, next) {

    // check header or url parameters or post parameters for token
    var key = req.body.api_key || req.query.api_key;

    if (key) {
        // verifies API key
        if (config.get("API_KEY") == key) {
            // Auth is OK, pass control to the next middleware
            next();
        } else {
            log.info("API key wrong :(");
            return res.json({ status: 'FAIL'});
        }
    } else {
        log.info("No API key provided :(");
        // if there is no token
        // return an error
        return res.json({
            status: 'FAIL'
        });
    }
});

// ---------------------------------------------------------
// authentication (no middleware necessary since this is not authenticated)
// ---------------------------------------------------------
router.post('/authenticate', function(req, res) {

    if (req.body._id && req.body.loginType == "LOCAL") {
        query = {'_id' : req.body._id, 'password' : req.body.password, 'loginType' : req.body.loginType};
        log.info("Local user to Authenticate. query: ", query.toString());

        // find the user
        UserModel.findOne(query, function (err, user) {
            if (user) {
                log.info("User found: ", user._id.toString());
                // check if password matches
                if (config.get("API_KEY") != req.body.api_key) {
                    res.json({ status: 'FAIL', message: 'Authentication failed. Wrong API_KEY.' });
                } else {
                    // if user is found and password is right
                    // create a token
                    // Note! first param must be a JSON
                    log.info("User ", user.firstName, " ", user.lastName, " getting a Token..");
                    var token = jwt.sign({'user':user}, config.get('secret'), { expiresInMinutes: 30 });
                    res.json({
                        status: 'OK',
                        message: 'Enjoy your token!',
                        token: token
                    });
                }
            }
            else if (!user) {
                res.json({ status: 'FAIL', message: 'Authentication failed. User not found.' });
            } else {
                res.statusCode = 500;
                res.send({status: 'FAIL', error: 'Server error' });
            }
        });

    } else if (req.body.social_id && req.body.loginType == "FACEBOOK") {
        log.info("Facebook user to Authenticate: ", req.body.social_id);
        query = {'social_id' : req.body.social_id, 'loginType' : req.body.loginType};

        // find the user
        UserModel.findOne(query, function(err, user) {
            if (user) {
                log.info("User found: ", user._id.toString());
                // check if password matches
                if (config.get("API_KEY") != req.body.api_key) {
                    log.info("api key error");
                    res.json({status: 'FAIL', message: 'Authentication failed. Wrong API_KEY.'});
                } else {
                    // if user is found and password is right
                    // create a token
                    // Note! first param must be a JSON
                    log.info("User ", user.firstName, " ", user.lastName, " getting a Token..");
                    var token = jwt.sign({'user': user}, config.get('secret'), {expiresInMinutes: 30});
                    res.json({
                        status: 'OK',
                        message: 'Enjoy your token!',
                        token: token
                    });
                }
            } else if (!user) {
                res.json({status: 'FAIL', message: 'Authentication failed. User not found.'});
            }
            else {
                res.statusCode = 500;
                res.send({status: 'FAIL', error: 'Server error' });
            }
        });

    } else {
        log.error("Unknown user type !");
        return res.send({status: 'fail', error : "No id specified."});
    }
});

// ---------------------------------------------------------
// Registering a user without a Social account
// ---------------------------------------------------------
router.post('/local', function(req, res) {
    log.info('name: ', req.body.firstName, ' ', req.body.lastName);

    var queryUser;
    var newUser
        = new UserModel({
        'firstName' : req.body.firstName,
        'lastName'  : req.body.lastName,
        'email'     : req.body.email,
        'password'  : req.body.password,
        'loginType' : req.body.loginType        // LOCAL
    });

    log.info("User: ", newUser.loginType, " ", newUser.firstName, " ", newUser.lastName,
        " ", newUser.email, " ", newUser.password);

    if (newUser.loginType != "LOCAL" || !newUser.firstName || !newUser.lastName
        || !newUser.email || !newUser.password) {
        log.info("Not enough info to register a user locally !");
        return res.send({status: 'fail', error : "Not enough info."});
    } else {
        // social ID and type must be entered
        queryUser = {'email' : newUser.email, 'loginType' : newUser.loginType};

        UserModel.findOne(queryUser, function (err, user) {
            if (user) {
                //TODO: token must be updated!
                if (user.verification == true) {
                    log.info("User has already signed up and Verified");
                    return res.send({status: 'ALREADY'});
                } else {
                    log.info("User has already signed up and but not Verified");
                    return res.send({status: 'NOT_VERIFIED'});
                }
            } else if (!user) {
                log.info("User not found! Creating it..");

                newUser.verifyToken = jwt.sign({'user':newUser}, config.get('secret'), { expiresInMinutes: 1440 });
                newUser.save(function (err) {
                    if (!err) {
                        host = req.get('host');
                        link = config.get('http_protocol') + config.get('mds_url') + "/mds/signup/verify?id=" + newUser._id.toString() + "&token=" +  newUser.verifyToken;

                        //console.log("link: " + link);
                        mailOptions = {
                            from    : "info@markod.net",
                            to      : newUser.email,
                            subject : "markod.net: Please confirm your Email account",
                            html    : "Hello,<br> Welcome to Markod !!<br> Please Click on the link to verify your email.<br><a href="+link+">Click here to verify</a>"
                        };
                        //console.log(mailOptions);
                        smtpTransport.sendMail(mailOptions, function(error, response){
                            if (error) {
                                console.log(error);
                                res.end({error: 'Mail error'});
                            } else {
                                log.info("User created. Verification email sent. Res: " + response.message);
                                return res.send({ status: 'OK'});
                            }
                        });
                    } else {
                        console.log(err);
                        if (err.name == 'ValidationError') {
                            res.statusCode = 400;
                            res.send({ error: 'Validation error' });
                        } else {
                            res.statusCode = 500;
                            res.send({ error: 'Server error' });
                        }
                        log.error('Internal error(%d): %s', res.statusCode, err.message);
                    }
                });
            } else {
                res.statusCode = 500;
                log.error('Internal error(%d): %s', res.statusCode, err.message);
                return res.send({error: 'Server error'});
            }
        });
    }
});

// ---------------------------------------------------------
// authentication (no middleware necessary since this is not authenticated)
// ---------------------------------------------------------
router.post('/login', function(req, res) {
    if (req.body.loginType == "") {
        log.info("Login Type not specified !");
        return res.send({status: 'FAIL', error : "No id specified."});
    }

    if (req.body.loginType == "LOCAL") {
        if (!req.body.email || !req.body.password) {
            log.info("User ID/Password not specified !");
            return res.send({status: 'FAIL', error : "No id specified."});
        }
        log.info('name: ', req.body.email, ' ', req.body.password);
        // social ID and type must be entered
        queryUser = {'email' : req.body.email, 'password' : req.body.password};

        UserModel.findOne(queryUser, function (err, user) {
            if (user) {
                //TODO: token must be updated!
                log.info("User found with Social account id: ", user._id.toString());
                if (user.verification) {
                    return res.send({status: 'OK', user: user});
                } else {
                    return res.send({status: 'NOT_VERIFIED'});
                }
            } else if (!user) {
                log.info("User not found!");
                return res.send({status: 'NO_USER'});
            } else {
                res.statusCode = 500;
                log.error('Internal error(%d): %s', res.statusCode, err.message);
                return res.send({status: 'FAIL', error: 'Server error'});
            }
        });
    } else if (req.body.loginType == "FACEBOOK") {
        /*
        TODO: Only User's social ID is not enough to secure!
        Hint: DB ID is also be required
         */
        if (!req.body.social_id) {
            log.info("Social ID not specified !");
            return res.send({status: 'FAIL', error : "No id specified."});
        }

        queryUser = {'social_id' : req.body.social_id, 'loginType' : req.body.loginType};

        UserModel.findOne(queryUser, function (err, user) {
            if (user) {
                //TODO: token must be updated!
                log.info("User found with Social account id: ", user._id.toString());
                if (user.verification) {
                    return res.send({status: 'OK', user: user});
                } else {
                    return res.send({status: 'NOT_VERIFIED'});
                }
            } else if (!user) {
                log.info("User not found!");
                return res.send({status: 'NO_USER'});
            } else {
                res.statusCode = 500;
                log.error('Internal error(%d): %s', res.statusCode, err.message);
                return res.send({status: 'FAIL', error: 'Server error'});
            }
        });
    }

});

// ---------------------------------------------------------
// authentication (no middleware necessary since this is not authenticated)
// ---------------------------------------------------------
router.post('/social', function(req, res) {
    log.info('name: ', req.body.firstName, ' ', req.body.lastName);
    log.info('social_id: ', req.body.social_id, ' loginType: ', req.body.loginType);

    if (!req.body.social_id || !req.body.loginType) {
        log.info("User ID or Login Type not specified !");
        return res.send({status: 'fail', error : "No id specified."});
    } else {
        //let queryUser;
        var newUser
            = new UserModel({
            'firstName' : req.body.firstName,
            'lastName'  : req.body.lastName,
            'email'     : req.body.email,
            'username'  : req.body.username,
            'social_id' : req.body.social_id,
            'loginType' : req.body.loginType
        });

        // social ID and type must be entered
        queryUser = {'social_id' : req.body.social_id, 'loginType' : req.body.loginType};

        if (req.body.loginType == "FACEBOOK") {
            log.info("User signing up with facebook account id: ", req.body.social_id);
        } else if (req.body.loginType == "GOOGLE") {
            log.info("User signing up with google account id: ", req.body.social_id);
        } else {
            log.info("New user signing up with own details.");
            log.err("No Local signup yet. Use social media.");
            //TODO: get username and password
            return res.send({status: 'fail', error : "No Local signup yet. Use social media."});
        }

        UserModel.findOne(queryUser, function (err, user) {
            if (user) {
                //TODO: token must be updated!
                log.info("User has already signed up with Social account id: ", user.social_id);
                return res.send({status: 'OK', user: user});
            } else if (!user) {
                log.info("User not found! Creating new with Social account id: ", newUser.social_id);
                newUser.save(function (err) {
                    if (!err) {
                        log.info("User created.");
                        return res.send({ status: 'OK', user : newUser });
                    } else {
                        console.log(err);
                        if(err.name == 'ValidationError') {
                            res.statusCode = 400;
                            res.send({ error: 'Validation error' });
                        } else {
                            res.statusCode = 500;
                            res.send({ error: 'Server error' });
                        }
                        log.error('Internal error(%d): %s', res.statusCode, err.message);
                    }
                });
            } else {
                res.statusCode = 500;
                log.error('Internal error(%d): %s', res.statusCode, err.message);
                return res.send({error: 'Server error'});
            }
        });
    }
});

module.exports = router;