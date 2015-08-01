/**
 * Created by kadir on 02.07.2015.
 */
var UserModel    = require('../libs/mongoose').UserModel;
var log     = require('../libs/log')(module);
var config  = require('../libs/config');
var express = require('express');
var router  = express.Router();

// ---------------------------------------------------------
// authentication (no middleware necessary since this is not authenticated)
// ---------------------------------------------------------
router.post('/social', function(req, res) {
    log.info('name: ', req.body.firstName, ' ', req.body.lastName);
    log.info('email: ', req.body.email);
    log.info('social: ', req.body.social);

    var queryUser;
    var newUser
        = new UserModel({
        'firstName' : req.body.firstName,
        'lastName' : req.body.lastName,
        'email': req.body.email,
        'social.id' : req.body.id,
        'loginType' : req.body.social
    });

    if (!req.body.id || !req.body.social) {
        log.info("User ID or Login Type not specified !");
        return res.send({status: 'fail', error : "No id specified."});
    } else {
        // social ID and type must be entered
        queryUser = {'social.id' : req.body.id, 'loginType' : req.body.social};

        if (req.body.social == "FACEBOOK_USER") {
            log.info("User signing up with facebook account id: ", req.body.id);
        } else if (req.body.social == "GOOGLE_USER") {
            log.info("User signing up with google account id: ", req.body.id);
        } else {
            log.info("New user signing up with own details.");
            log.err("No Local signup yet. Use social media.");
            //TODO: get username and password
            return res.send({status: 'fail', error : "No Local signup yet. Use social media."});
        }

        UserModel.findOne(queryUser, function (err, user) {
            if (user) {
                //TODO: token must be updated!
                log.info("User has already signed up with Social account id: ", req.body.id);
                return res.send({status: 'OK', user: user});
            } else if (!user) {
                log.info("User not found! Creating new with Social account id: ", req.body.id);
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