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
var smtpTransport = nodemailer.createTransport("SMTP", {
    service: "Gmail",
    auth: {
        user: "kyasar07@gmail.com",
        pass: "Peijreby007"
    }
});
var mailOptions, host, link;

router.get('/verify', function(req, res) {
    console.log(req.protocol + "://" + req.get('host'));

    if (!req.query.id || !req.query.token) {
        log.info("No Id or Token specified.");
        return res.send({status: 'fail', error : "No Id or Token specified."});
    }

    if ((req.protocol + "://" + req.get('host')) == ("http://" + host))
    {
        console.log("Searching for user id: ", req.query.id);

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
    }
    else
    {
        return res.send({status: 'fail', error: 'Request is from unknown source.'});
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

                newUser.verifyToken = jwt.sign({'user':newUser}, config.get('secret'), { expiresInMinutes: 1 });
                newUser.save(function (err) {
                    if (!err) {
                        host = req.get('host');
                        link = "http://" + req.get('host') + "/mds/signup/verify?id=" + newUser._id.toString() + "&token=" +  newUser.verifyToken;
                        //console.log("link: " + link);
                        mailOptions = {
                            from    : "Markod",
                            to      : newUser.email,
                            subject : "Please confirm your Email account",
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
    if (!req.body.email || !req.body.password || req.body.loginType != "LOCAL") {
        log.info("User ID or Login Type not specified !");
        return res.send({status: 'fail', error : "No id specified."});
    } else {
        log.info('name: ', req.body.email, ' ', req.body.password);
        // social ID and type must be entered
        queryUser = {'email' : req.body.email, 'password' : req.body.password};

        UserModel.findOne(queryUser, function (err, user) {
            if (user) {
                //TODO: token must be updated!
                log.info("User found with Social account id: ", user.social_id);
                return res.send({status: 'OK', user: user});
            } else if (!user) {
                log.info("User not found!");
                return res.send({status: 'fail', error: 'No such user'});
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
router.post('/social', function(req, res) {
    log.info('name: ', req.body.firstName, ' ', req.body.lastName);
    log.info('social_id: ', req.body.social_id, ' loginType: ', req.body.loginType);

    var queryUser;
    var newUser
        = new UserModel({
        'firstName' : req.body.firstName,
        'lastName'  : req.body.lastName,
        'email'     : req.body.email,
        'username'  : req.body.username,
        'social_id' : req.body.social_id,
        'loginType' : req.body.loginType
    });

    if (!req.body.social_id || !req.body.loginType) {
        log.info("User ID or Login Type not specified !");
        return res.send({status: 'fail', error : "No id specified."});
    } else {
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