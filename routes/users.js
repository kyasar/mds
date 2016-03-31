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

module.exports = router;