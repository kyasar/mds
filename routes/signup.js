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
// http://localhost:8080/mds/api/authenticate
router.post('/fb', function(req, res) {
    log.info('name: ', req.body.firstName, ' ', req.body.lastName);
    log.info('email: ', req.body.email);
    log.info('id: ', req.body.id);

    var newUser
        = new UserModel({
        'firstName' : req.body.firstName,
        'lastName' : req.body.lastName,
        'email': req.body.email,
        'facebook.id'   : req.body.id,
    });

    UserModel.findOne({'facebook.id': req.body.id}, function (err, user) {
        if (user) {
            //TODO: token must be updated!
            log.info("User has already signed up with facebook account id: ", req.body.id);
            return res.send({status: 'OK', user: user});
        } else if (!user) {
            log.info("User not found! Creating new with facebook account id: ", req.body.id);
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
});

router.post('/google', function(req, res) {
    log.info('name: ', req.body.firstName, ' ', req.body.lastName);
    log.info('email: ', req.body.email);
    log.info('id: ', req.body.id);

    var newUser
        = new UserModel({
        'firstName' : req.body.firstName,
        'lastName' : req.body.lastName,
        'email': req.body.email,
        'google.id'   : req.body.id,
    });

    if (newUser.google.id == "") {
        log.info("User id not specified !");
        return res.send({status: 'fail', error : "No id specified."});
    } else {
        UserModel.findOne({'google.id': req.body.id}, function (err, user) {
            if (user) {
                //TODO: token must be updated!
                log.info("User has already signed up with google account id: ", req.body.id);
                return res.send({status: 'OK', user: user});
            } else if (!user) {
                log.info("User not found! Creating new with google account id: ", req.body.id);
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