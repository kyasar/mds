/**
 * Created by kadir on 03.04.2016.
 */
var ProductModel   = require('../libs/mongoose').ProductModel;
var MarketModel    = require('../libs/mongoose').MarketModel;
var User    = require('../libs/mongoose').UserModel;
var log     = require('../libs/log')(module);
var config  = require('../libs/config');
var _ = require('underscore');
var express = require('express');
var router  = express.Router();
var async = require('async');

/*
 SCAN method, scans the markets given in markets fields of JSON request for given
 products list, Returns the markets containing products with their prices
 */
router.post('/scan/', function(req, res) {

    if (!req.body.markets || !req.body.products) {
        log.info("Market List or Product List not specified !");
        return res.send({status: 'fail', error : "No list specified."});
    }

    var respond = {status : 'OK', markets : []};

    async.series([
        /*
            First task, scans the given market list for given product list
         */
        function(callback) {
            async.eachSeries(req.body.markets, function(m, callback) {
                //log.info("Scanning market: ", m.id);
                MarketModel.findOne({'id': m.maps_id}, function (err, market) {
                    if (market) {
                        log.info("Market found in the system with id: ", market.id);

                        var products = [];
                        for (var j = 0; j < req.body.products.length; j++) {

                            product = _.find(market.products, function (p) {
                                return req.body.products[j].barcode == p.barcode;
                            });

                            if (product) {
                                log.info("Product (", product.barcode, ") found in this market (",
                                    market.id, ") Price: ", product.price);
                                // Just include product barcode and price
                                var p = {'barcode' : product.barcode, 'price' : product.price}
                                products.push(p);
                            }
                        }

                        // Does this market contain the products?
                        if (products.length != 0) {
                            var market = {'id' : market.id, 'products' : products};
                            respond.markets.push(market);
                        }
                    }
                    else if (!market) {
                        log.info("Market NOT found in the system  with id: ", m.maps_id);
                    }
                    else {
                        res.statusCode = 500;
                        log.error('Internal error(%d): %s', res.statusCode, err.message);
                        return res.send({status: 'fail', error: 'Server error'});
                    }
                    callback(err);
                });
            }, function(err) {
                if (err) {
                    res.statusCode = 500;
                    res.send({status: 'fail', error: 'Server error'});
                }
                log.info('done');
                callback();
            });
        },

        /* This task is run after First task is finished
         * And, it just logs the product list */
        function(callback) {
            for (var i = 0; i < req.body.products.length; i++) {
                log.info("Product #", i, ": ", req.body.products[i].barcode);
            }
            callback();
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
        res.send(respond);
    });
});

/*
This methods scans markets in near given location and finds the prices of
 the product given barcode - for Web APP
 */
router.get('/scannearby/', function(req, res) {

    if (!req.query.long || !req.query.lat || !req.query.max_dist || !req.query.barcode) {
        log.info("Not enough info specified.");
        return res.send({status: 'fail', error: "Not enough info specified."});
    }
    log.info("long:", req.query.long, " lat:", req.query.lat,
        " max_dist:", req.query.max_dist, " barcode: ", req.query.barcode);

    /*if (!req.body.products) {
        log.info("Product List not specified !");
        return res.send({status: 'fail', error : "No list specified."});
    }*/
    var respond = {status : 'OK', markets : []};
    var markets;

    async.series([
            /*
             First task, grabs nearby markets
             */
            function(callback) {
                MarketModel.find({ loc : { $near : { $geometry : { type : "Point" ,
                        coordinates : [req.query.lat, req.query.long] },
                        $maxDistance : parseInt(req.query.max_dist) } } },
                    { name : 1, loc : 1, products : 1, vicinity: 1, _id : 0 },
                    function (err, results) {
                        if (!err)
                        {
                            log.info("Markets number: ", results.length);
                            //res.send({'status': 'OK', 'markets' : markets});
                            markets = results;
                        }
                        else
                        {
                            res.statusCode = 500;
                            log.error('Internal error(%d): %s', res.statusCode, err.message);
                            return res.send({status: 'fail', error: 'Server error'});
                        }
                        callback(err);
                    });
            },

            /* Search grabbed markets for given product(s) */
            function(callback) {
                for (var i = 0; i < markets.length; i++) {
                    log.info("Market #", i, ": ", markets[i].name, " # of products: ", markets[i].products.length);
                    var products = markets[i].products;
                    var found = 0;
                    for (var j = 0; j < products.length; j++) {
                        if (products[j].barcode == req.query.barcode) {
                            log.info("Product found in this market: ", markets[i].name);
                            found = 1;
                            /*
                            No need to send all product list of the market
                             */
                            markets[i].products = undefined;
                            markets[i].products = [];
                            markets[i].products.push(products[j]);
                        }
                    }
                    /*
                    At least, 1 porduct found in the market
                     */
                    if (found) {
                        respond.markets.push(markets[i]);
                    }
                }
                callback();
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
            log.info("Sending response..");
            res.send(respond);
        });
});

module.exports = router;