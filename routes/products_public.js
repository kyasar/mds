/**
 * Created by kadir on 02.04.2016.
 */
/*

 API Definitions
 Method  URL                             Definition
 ======  =============================== ==========
 GET     mds/api/products                Fetches all products
 GET     mds/api/products:barcode        Fetch a products mathcing with barcode
 POST    mds/api/products                Adds a new Product

 */

var ProductModel   = require('../libs/mongoose').ProductModel;
var MarketModel    = require('../libs/mongoose').MarketModel;
var User    = require('../libs/mongoose').UserModel;
var CategoryModel    = require('../libs/mongoose').CategoryModel;
var log     = require('../libs/log')(module);
var jwt     = require('jsonwebtoken'); // used to create, sign, and verify tokens
var config  = require('../libs/config');
var _ = require('underscore');
var express = require('express');
var router  = express.Router();
var async = require('async');
var sleep = require('sleep');

/*
 Search for products that matches the query string
 Return fields name, barcode (modified?) (image later?)
 */
router.get('/products/', function(req, res) {
    var rgx = new RegExp('\\b' + req.query.search, "gi");
    log.info("rgx: ", rgx.toString());
    return ProductModel.find({ name : { $regex : rgx} },
    //return ProductModel.find({ $text : { $search : req.query.search } },
        function(err, products) {
        if (!err) {
            return res.send({status: 'OK', product: products});
        } else {
            res.statusCode = 500;
            log.error('Internal error(%d): %s', res.statusCode, err.message);
            return res.send({status: 'fail', error: 'Server error' });
        }
    }).select({name: 1, barcode: 1, _id: 0}).limit(config.get('PRODUCT_SEARCH_RESULTS_LIMIT'));
});

router.get('/products/all', function(req, res) {
    log.info("Page: ", req.query.page, " Limit: ", req.query.limit);
    var queryStr = {};
    if (req.query.name != undefined)
    {
        queryStr.name = req.query.name;
    }
    else if (req.query.barcode != undefined)
    {
        queryStr.barcode = req.query.barcode;
    }
    log.info("Products all queryStr: ", JSON.stringify(queryStr) );
    return ProductModel.paginate(queryStr, { page: req.query.page, limit: req.query.limit },
        function(err, products) {
            if (!err) {
                return res.send({status: 'OK', products: products});
            } else {
                res.statusCode = 500;
                log.error('Internal error(%d): %s', res.statusCode, err.message);
                return res.send({status: 'fail', error: 'Server error' });
            }
        });
});

/**
 * @api {get} /mds/api/products/:barcode Request a product with given barcode
 * @apiName GetProduct
 * @apiGroup Product
 *
 * @apiParam {Number} barcode Barcode of the product being searched
 *
 * @apiSuccess {String} barcode barcode number (unique) of the Product.
 * @apiSuccess {String} name full name of the Product.
 *
 * @apiSuccessExample Success-Response:
 *      HTTP/1.1 200 OK
 *      {
 *          "status": "OK",
 *          "product": {
 *              "barcode": "8697520000010",
 *              "name": "Saka su 1L",
 *              "modified": "2016-03-29T19:45:29.868Z"
 *          }
 *      }
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 200 OK
 *     {
 *          "status": "OK",
 *          "product": null
 *     }
 */
router.get('/products/:barcode', function(req, res) {
    log.info('Searching for product with barcode: ', req.params.barcode);
    return ProductModel.findOne({ barcode : req.params.barcode }, function(err, product) {
        if (!err) {
            return res.send({status: 'OK', product: product});
        } else {
            res.statusCode = 500;
            log.error('Internal error(%d): %s', res.statusCode, err.message);
            return res.send({status: 'fail', error: 'Server error' });
        }
    }).select({name: 1, barcode: 1, _id: 0});
});

router.delete('/products/:barcode', function(req, res) {
    log.info('Removing product with barcode: ', req.params.barcode);

    return ProductModel.findOne({ barcode : req.params.barcode }, function(err, product) {
        if (!err) {
            if (product) {
                product.remove({barcode: req.params.barcode}, function (err, product) {
                    if (!err) {
                        log.info("Product removed in server side (from DB)");
                        return res.send({status: 'OK'});
                    } else {
                        res.statusCode = 500;
                        log.error('Internal error(%d): %s', res.statusCode, err.message);
                        return res.send({status: 'fail', error: 'Server error'});
                    }
                });
            } else {
                log.info("No such product !");
                return res.send({status: 'fail', error: 'No such product' });
            }
        } else {
            res.statusCode = 500;
            log.error('Internal error(%d): %s', res.statusCode, err.message);
            return res.send({status: 'fail', error: 'Server error' });
        }
    });
});

router.put('/products/:barcode', function(req, res) {
    log.info('Updating product with barcode: ', req.params.barcode);
    log.info('New product: ', req.body.name, ' ', req.body.barcode);
    ProductModel.update({'barcode' : req.params.barcode },
        {'$set' : { 'barcode' : req.body.barcode,
            'name' : req.body.name,
            'modified': Date.now()
            }
        },
        function (err, product) {
            if (!err) {
                log.info("Product updated.");
                return res.send({ status: 'OK', product : product });
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