/**
 * Created by kadir on 31.03.2016.
 */

var UserModel      = require('../libs/mongoose').UserModel;
var log     = require('../libs/log')(module);
var config  = require('../libs/config');
var express = require('express');
var router  = express.Router();

/*
 User info can be updated; ie Shoplists.
 */
router.post('/update/', function(req, res) {
    if (!req.body._id) {
        log.info("User Id is not specified !");
        return res.send({status: 'fail', error : "No Id specified."});
    }

    if (!req.body.shopLists && !req.body.markets) {
        log.info("No data is given to update user !");
        return res.send({status: 'fail', error : "No data specified."});
    }

    log.info("User: ", req.body._id, " shoplist: ", req.body.shopLists);
    UserModel.findByIdAndUpdate(req.body._id
        , {'$set': {'shopLists': req.body.shopLists } }  // Use $set to change shopList completely, $addToSet aggregate them!
        , { new: true, upsert: false }  // Return updated object, Do not insert if not exists
        , function (err, user) {
            if (user) {
                log.info("user updated !");
                return res.send({status: 'OK', user: user});
            } else if (err) {
                console.log(err);
                if (err.name == 'ValidationError') {
                    res.statusCode = 400;
                    res.send({status: 'fail', error: 'Validation error'});
                } else {
                    res.statusCode = 500;
                    res.send({status: 'fail', error: 'Server error'});
                }
                log.error('Internal error(%d): %s', res.statusCode, err.message);
            } else {
                log.info("user not found !");
                return res.send({status: 'fail', error: "User not found."});
            }
        });
});

module.exports = router;