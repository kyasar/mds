/**
 * Created by kadir on 31.03.2016.
 */

var UserModel      = require('../libs/mongoose').UserModel;
var log     = require('../libs/log')(module);
var config  = require('../libs/config');
var _ = require('underscore');
var express = require('express');
var router  = express.Router();
var async = require('async');

router.get('/', function(req, res) {
    return UserModel.find({}, function(err, users) {
        if (!err) {
            return res.send({ status: 'OK', users: users });
        } else {
            return res.send({ status: 'fail' });
        }
    }).select({__v: 0, _id: 0})
});

router.get('/all', function(req, res) {
    if (!req.query.page || !req.query.limit) {
        return res.send({status: 'fail', error: 'No such API usage.' });
    }

    log.info("Page: ", req.query.page, " Limit: ", req.query.limit);
    return UserModel.paginate({}, { page: req.query.page, limit: req.query.limit },
        function(err, users) {
            if (!err) {
                return res.send({status: 'OK', users: users});
            } else {
                res.statusCode = 500;
                log.error('Internal error(%d): %s', res.statusCode, err.message);
                return res.send({status: 'fail', error: 'Server error' });
            }
        });
});

router.delete('/:email', function(req, res) {
    log.info('Removing user with email: ', req.params.email);

    return UserModel.findOne({ email : req.params.email }, function(err, user) {
        if (!err) {
            if (user) {
                user.remove({email: req.params.email}, function (err, user) {
                    if (!err) {
                        log.info("user removed in server side (from DB)");
                        return res.send({status: 'OK'});
                    } else {
                        res.statusCode = 500;
                        log.error('Internal error(%d): %s', res.statusCode, err.message);
                        return res.send({status: 'fail', error: 'Server error'});
                    }
                });
            } else {
                log.info("No such user !");
                return res.send({status: 'fail', error: 'No such user' });
            }
        } else {
            res.statusCode = 500;
            log.error('Internal error(%d): %s', res.statusCode, err.message);
            return res.send({status: 'fail', error: 'Server error' });
        }
    });
});

router.put('/:email', function(req, res) {
    log.info('Updating user with email: ', req.params.email);
    log.info('New user: ', req.body.email, ' ', req.body.points);
    UserModel.update({'email' : req.params.email },
        {'$set' : {
            'firstName' : req.body.firstName,
            'lastName' : req.body.lastName,
            'email' : req.body.email,
            'password' : req.body.password,
            'verification' : req.body.verification,
            'points' : req.body.points
            }
        },
        function (err, user) {
            if (!err) {
                log.info("user updated.");
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
});

module.exports = router;