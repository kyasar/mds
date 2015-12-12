/**
 * Created by kadir on 24.06.2015.
 */

var ProductModel   = require('../libs/mongoose').ProductModel;
var MarketModel    = require('../libs/mongoose').MarketModel;
var User    = require('../libs/mongoose').UserModel;
var log     = require('../libs/log')(module);
var jwt     = require('jsonwebtoken'); // used to create, sign, and verify tokens
var config  = require('../libs/config');
var _ = require('underscore');
var express = require('express');
var router  = express.Router();
var async = require('async');

router.get('/test', function(req, res) {
    return User.findOne({}, function(err, user) {
        if (!err) {
            return res.send(user);
        } else {
            res.statusCode = 500;
            log.error('Internal error(%d): %s', res.statusCode, err.message);
            return res.send({status: 'fail', error: 'Server error' });
        }
    });
});

// ---------------------------------------------------------
// route middleware to authenticate and check API key
// a middleware with no mount path; gets executed for every request to the app
// ---------------------------------------------------------
router.use(function(req, res, next) {

    // check header or url parameters or post parameters for token
    var key = req.body.api_key || req.query.api_key;

    if (key) {
        // verifies API key
        if (config.get("API_KEY") == key) {
            // Auth is OK, pass control to the next middleware
            next();
        } else {
            log.info("API key wrong :(");
            return res.json({ status: 'FAIL'});
        }
    } else {
        log.info("No API key provided :(");
        // if there is no token
        // return an error
        return res.json({
            status: 'FAIL'
        });
    }
});

/*
 Search for products that matches the query string
 Return fields name, barcode (modified?) (image later?)
 */
router.get('/products/', function(req, res) {
    log.info('Searching for product with name:', req.query.search);
    return ProductModel.find({ $text : { $search : req.query.search } },
        function(err, products) {
        if (!err) {
            return res.send({status: 'OK', product: products});
        } else {
            res.statusCode = 500;
            log.error('Internal error(%d): %s', res.statusCode, err.message);
            return res.send({status: 'fail', error: 'Server error' });
        }
    }).select({name: 1, barcode: 1, _id: 0});
});

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
                MarketModel.findOne({'id': m.id}, function (err, market) {
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
                        log.info("Market NOT found in the system  with id: ", m.id);
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

// ---------------------------------------------------------
// route middleware to authenticate and check token
// a middleware with no mount path; gets executed for every request to the app
// ---------------------------------------------------------
router.use(function(req, res, next) {

    // check header or url parameters or post parameters for token
    var token = req.body.token || req.query.token || req.headers['x-access-token'];
    // decode token
    if (token == "test") {
        log.info("Test is running.. No token..");
        next();
    } else {
        if (token) {
            // verifies secret and checks exp
            jwt.verify(token, config.get('secret'), function(err, decoded) {
                if (err) {
                    log.info("Token expired :(");
                    return res.json({ status: 'EXPIRED', message: 'Failed to authenticate token.' });
                } else {
                    log.info("Token OK :)");
                    // a middleware (function) can access to the request object (req), the response object (res),
                    // and the next middleware in line in the request-response cycle of an Express application
                    // if everything is good, save User to request for use in other routes
                    // -> decoded.user contains user retrieved from db
                    req.decoded = decoded;
                    // Auth is OK, pass control to the next middleware
                    next();
                }
            });
        } else {
            log.info("No token provided :(");
            // if there is no token
            // return an error
            return res.json({
                status: 'NOTOKEN',
                message: 'No token provided.'
            });
        }
    }
});

router.get('/products/', function(req, res) {
    return ProductModel.find( function(err, products) {
        if (!err) {
            return res.send(products);
        } else {
            res.statusCode = 500;
            log.error('Internal error(%d): %s', res.statusCode, err.message);
            return res.send({status: 'fail', error: 'Server error' });
        }
    });
});

// function to create file from base64 encoded string
var fs = require('fs');
function base64_decode(base64str) {
    // create buffer object from base64 encoded string, it is important to tell the constructor that the string is base64 encoded
    var bitmap = new Buffer(base64str, 'base64');
    // write buffer to file
    fs.writeFileSync('kadir.jpg', bitmap);
    log.info('******** File created from base64 encoded string ********');
}

router.post('/products/', function(req, res) {
    if (!req.body.name || !req.body.barcode || !req.body.userID) {
        log.info("Product name or barcode not specified !");
        return res.send({status: 'fail', error : "No name or barcode or user specified."});
    }
    log.info('New product: ', req.body.name, ' ', req.body.barcode);
    var product
        = new ProductModel({
        barcode: req.body.barcode,
        name: req.body.name,
        encodedPhoto: req.body.encodedPhoto
    });

    var productUpdateObj = {};
    productUpdateObj.name = product.name;
    productUpdateObj.barcode = product.barcode;
    productUpdateObj.modified = new Date().toISOString()

    if (req.body.encodedPhoto) {
        log.info("New product comes with its photo..");
        productUpdateObj.encodedPhoto = product.encodedPhoto;
        // base64_decode(req.body.encodedPhoto)
    }

    ProductModel.findOneAndUpdate({ 'barcode': product.barcode }
        , { $set: productUpdateObj }
        , { upsert: true }, function (err) {
        if (!err) {
            log.info("product created !");

            var points = config.get('coeff_ap');

            User.findByIdAndUpdate(req.body.userID,
                { $inc : { 'points' : points } },
                {new: true, upsert : false },  // Return updated object, Do not insert if not exists
                function (err, user) {
                    if (!err) {
                        log.info("User: ", user.firstName, " earned ", points, " points.");
                        log.info("User: ", user._id.toString(), " has ", user.points, " points.");
                        res.send({ status: 'OK', user : user });
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
            //return res.send({ status: 'OK', product : product });
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
Gets a JSON object containing market details and products which will be matched with the market
Saves the market if not existing in DB, then associates the products with their prices
Method: POST, Content-Type: Application/JSON
 */
router.post('/market/', function(req, res) {

    if (!req.body.id || !req.body.userID) {
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
            'id'       : req.body.id,
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

            //TODO: Add points to User account
            User.findByIdAndUpdate(userID,
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
})

/*
User info can be updated; ie Shoplists.
 */
var sleep = require('sleep');
router.post('/user-update/', function(req, res) {
    if (!req.body._id || !req.body.shopLists) {
        log.info("User Id is not specified !");
        return res.send({status: 'fail', error : "No Id specified."});
    }
    sleep.sleep(5);
    log.info("User: ", req.body._id, " shoplist: ", req.body.shopLists);
    User.findByIdAndUpdate(req.body._id
        , {'$set' : { 'shopLists' : req.body.shopLists } }  // Use $set to change shopList completely, $addToSet aggregate them!
        , {new: true, upsert : false }  // Return updated object, Do not insert if not exists
        , function (err, user) {
            if (user) {
                log.info("user updated !");
                return res.send({ status: 'OK', user: user });
            } else if (err) {
                console.log(err);
                if(err.name == 'ValidationError') {
                    res.statusCode = 400;
                    res.send({status: 'fail', error: 'Validation error' });
                } else {
                    res.statusCode = 500;
                    res.send({status: 'fail', error: 'Server error' });
                }
                log.error('Internal error(%d): %s', res.statusCode, err.message);
            } else {
                log.info("user not found !");
                return res.send({ status: 'fail', error: "User not found." });
            }
        });
});

module.exports = router;