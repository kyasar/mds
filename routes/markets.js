/**
 * Created by kadir on 14.12.2015.
 */

var ProductModel   = require('../libs/mongoose').ProductModel;
var MarketModel    = require('../libs/mongoose').MarketModel;
var UserModel      = require('../libs/mongoose').UserModel;
var log     = require('../libs/log')(module);
var jwt     = require('jsonwebtoken'); // used to create, sign, and verify tokens
var config  = require('../libs/config');
var _ = require('underscore');
var express = require('express');
var router  = express.Router();
var async = require('async');

router.post('/nearby/', function(req, res) {
    if (!req.query.long || !req.query.lat || !req.query.max_dist) {
        log.info("No Lat or Long info specified !");
        return res.send({status: 'fail', error: "No location specified."});
    }
    log.info("long:", req.query.long, " lat:", req.query.lat, " max_dist:", req.query.max_dist);

    MarketModel.find({ loc : { $near : { $geometry : { type : "Point" ,
                coordinates : [req.query.lat, req.query.long] },
                $maxDistance : 500 } } },
                { name : 1, loc : 1, _id : 0 },
                function (err, markets) {
        if (!err)
        {
            log.info("Markets number: ", markets.length);
            res.send({'status': 'OK', 'markets' : markets});
        }
        else
        {
            res.statusCode = 500;
            log.error('Internal error(%d): %s', res.statusCode, err.message);
            return res.send({status: 'fail', error: 'Server error'});
        }
    });
});

router.post('/follow/', function(req, res) {
    if (!req.body._id) {
        log.info("User Id is not specified !");
        return res.send({status: 'fail', error: "No Id specified."});
    }

    if (!req.body.markets) {
        log.info("No data is given to update user !");
        return res.send({status: 'fail', error: "No data specified."});
    }

    log.info("User: ", req.body._id, " markets: ", req.body.markets);

    async.series([
            /*
             First task, scans the given market list for given product list
             */
            function(callback)
            {
                async.eachSeries(req.body.markets, function(m, callback)
                {
                    log.info("User: ", req.body._id, " market: ", m.id);
                    UserModel.findByIdAndUpdate(req.body._id
                        , {'$addToSet': {'following': m}}  // Use $set to change shopList completely, $addToSet aggregate them!
                        , {new: true, upsert: false}  // Return updated object, Do not insert if not exists
                        , function (err, user) {
                            if (user) {
                                log.info("user updated with following market: ", m.id);
                                //return res.send({status: 'OK', user: user});
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
                            callback(err);
                        });
                    //}
                }, function(err) {
                    if (err) {
                        res.statusCode = 500;
                        res.send({status: 'fail', error: 'Server error'});
                    }
                    callback();
                });
            },
            function(callback)
            {
                async.eachSeries(req.body.markets, function(m, callback) {
                    log.info("User: ", req.body._id, " market: ", m.id);

                    MarketModel.findOne({'id': m.id}, function (err, market) {
                        if (market) {
                            var follower = {'user_id' : req.body._id};

                            MarketModel.update({ 'id' : market.id },
                                {'$addToSet' : { 'followers' : follower } },
                                {new: true, upsert: false},  // Return updated object, Do not insert if not exists
                                function (err) {
                                    if (!err) {
                                        log.info("Market updated with Follower: ", follower.user_id);
                                        //return res.send({ status: 'OK', user : market });
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
                                    callback(err);
                                });
                        }
                        else if (!market) {
                            log.info("Market NOT found in the system  with id: ", m.id);
                            callback(err);
                        }
                        else {
                            res.statusCode = 500;
                            log.error('Internal error(%d): %s', res.statusCode, err.message);
                            callback(err);
                            return res.send({status: 'fail', error: 'Server error'});
                        }
                    });
                }, function(err) {
                    if (err) {
                        res.statusCode = 500;
                        res.send({status: 'fail', error: 'Server error'});
                    }
                    callback();
                });
            }
        ],
        /*
         Last callback, returns the respond containing markets that includes given products
         */
        function(err) {
            if (err) {
                res.statusCode = 500;
                res.send({status: 'fail', error: 'Server error'});
            }
            res.send({'status': 'OK'});
        }
    );  // Sync series finished here

});

router.post('/unfollow/', function(req, res) {
    if (!req.body._id) {
        log.info("User Id is not specified !");
        return res.send({status: 'fail', error: "No Id specified."});
    }

    if (!req.body.markets) {
        log.info("No data is given to update user !");
        return res.send({status: 'fail', error: "No data specified."});
    }

    log.info("User: ", req.body._id, " markets: ", req.body.markets);

    async.series([
            /*
             First task, scans the given market list for given product list
             */
            function(callback)
            {
                async.eachSeries(req.body.markets, function(m, callback)
                {
                    log.info("User: ", req.body._id, " market: ", m.id);
                    UserModel.findByIdAndUpdate(req.body._id
                        , {'$pull': {'following': m}}  // Use $set to change shopList completely, $addToSet aggregate them!
                        //, {new: true, upsert: false}  // Return updated object, Do not insert if not exists
                        , function (err, user) {
                            if (user) {
                                log.info("user unfollowed market ", m.id);
                                //return res.send({status: 'OK', user: user});
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
                            callback(err);
                        });

                }, function(err) {
                    if (err) {
                        res.statusCode = 500;
                        res.send({status: 'fail', error: 'Server error'});
                    }
                    callback();
                });
            },
            function(callback)
            {
                async.eachSeries(req.body.markets, function(m, callback) {
                    log.info("User: ", req.body._id, " market: ", m.id);

                    MarketModel.findOne({'id': m.id}, function (err, market) {
                        if (market)
                        {
                            var follower = {'user_id' : req.body._id};

                            MarketModel.update({ 'id' : market.id },
                                {'$pull' : { 'followers' : follower } },
                                //{new: true, upsert: false},  // Return updated object, Do not insert if not exists
                                function (err) {
                                    if (!err) {
                                        log.info("Market removed Follower: ", follower.id);
                                        //return res.send({ status: 'OK', user : market });
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
                                    callback(err);
                                });
                        }
                        else if (!market) {
                            log.info("Market NOT found in the system  with id: ", m.id);
                            callback(err);
                        }
                        else {
                            res.statusCode = 500;
                            log.error('Internal error(%d): %s', res.statusCode, err.message);
                            callback(err);
                            return res.send({status: 'fail', error: 'Server error'});
                        }
                    });
                }, function(err) {
                    if (err) {
                        res.statusCode = 500;
                        res.send({status: 'fail', error: 'Server error'});
                    }
                    callback();
                });
            }
        ],
        /*
         Last callback, returns the respond containing markets that includes given products
         */
        function(err) {
            if (err) {
                res.statusCode = 500;
                res.send({status: 'fail', error: 'Server error'});
            }
            res.send({'status': 'OK'});
        }
    );  // Sync series finished here

});



module.exports = router;