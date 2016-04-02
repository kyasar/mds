/**
 * Created by kadir on 14.12.2015.
 */

var ProductModel   = require('../libs/mongoose').ProductModel;
var MarketModel    = require('../libs/mongoose').MarketModel;
var UserModel      = require('../libs/mongoose').UserModel;
var log     = require('../libs/log')(module);
var config  = require('../libs/config');
var _ = require('underscore');
var express = require('express');
var router  = express.Router();
var async = require('async');

/*
 Gets a JSON object containing market details and products which will be matched with the market
 Saves the market if not existing in DB, then associates the products with their prices
 Method: POST, Content-Type: Application/JSON
 */
router.post('/', function(req, res) {

    if (!req.body.maps_id || !req.body.userID) {
        log.info("Market ID or User ID not specified !");
        return res.send({status: 'fail', error : "No id specified."});
    } else {

        /*var arr = req.body['loc'].split(',');
         for (var i=0; i<arr.length; i++) {
         log.info("LOC: ", arr[i] );
         }*/
        var newMarket
            = new MarketModel({
            'name'     : req.body.name,
            'id'       : req.body.maps_id,
            'provider' : req.body.provider,
            'vicinity' : req.body.vicinity,
            'products' : req.body.products,
            'loc.coordinates'      : req.body['loc'].split(',').reverse()
        });

        log.info("market: ", newMarket.id);
        var userID = req.body.userID;

        var respond = {
            'status' : "OK",
            'new_products' : 0, // new products associated with the market
            'coeff_np'     : config.get('coeff_np'),
            'new_market'   : 0, // is that first check-in for this market?
            'coeff_nm'     : config.get('coeff_nm'),
            'products'     : 0,  // how many product updates?
            'coeff_p'      : config.get('coeff_p')
        };

        // social ID and type must be entered
        MarketModel.findOne({'id' : newMarket.id, 'provider' : newMarket.provider}, function (err, market) {
            if (market) {
                log.info("Market has already signed up with id: ", market.id);

                for (var i = 0; i < req.body.products.length; i++) {

                    log.info("Incoming product: ", req.body.products[i].barcode, " price: ", req.body.products[i].price);
                    product = _.find(market.products, function(p) {
                        return req.body.products[i].barcode == p.barcode;
                    });

                    if (product) {
                        log.info("Product already sold in Market, with price: ", product.price, " new: ", req.body.products[i].price);
                        respond.products += 1;
                        MarketModel.update({'id' : market.id, 'products.barcode' : product.barcode },
                            {'$set' : { 'products.$.price' : req.body.products[i].price,
                                'products.$.user' : req.body.user
                            } },
                            function (err) {
                                if (!err) {
                                    log.info("Market updated.");
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
                            });

                    } else {
                        log.info("Product new in this market, adding the product..");
                        req.body.products[i].user = req.body.user;
                        respond.new_products += 1;
                        MarketModel.update({ 'id' : market.id },
                            {'$addToSet' : { 'products' : req.body.products[i] } },
                            function (err) {
                                if (!err) {
                                    log.info("Market updated.");
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
                            });
                    }
                }

                // return the found and updated market
                //return res.send({status: 'OK'});

            } else if (!market) {
                log.info("market not found! Creating new with id: ", newMarket.id);
                respond.new_market += 1;
                respond.new_products += newMarket.products.length;
                newMarket.save(function (err) {
                    if (!err) {
                        log.info("Market created.");
                        //return res.send({ status: 'OK', user : newMarket });
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
            } else {
                res.statusCode = 500;
                log.error('Internal error(%d): %s', res.statusCode, err.message);
                return res.send({status: 'fail', error: 'Server error'});
            }

            var points = respond.new_market * config.get('coeff_nm')
                + respond.new_products * config.get('coeff_np')
                + respond.products * config.get('coeff_p');

            // Add points to User account
            UserModel.findByIdAndUpdate(userID,
                { $inc : { 'points' : points } },
                {new: true, upsert : false },  // Return updated object, Do not insert if not exists
                function (err, user) {
                    if (!err) {
                        log.info("User: ", user.firstName, " earned ", points, " points.");
                        log.info("User: ", user._id.toString(), " earned ", points, " points..");
                        res.send(respond);
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
    }
});

router.post('/follow/', function(req, res) {
    log.info("Follow a market requested.");
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