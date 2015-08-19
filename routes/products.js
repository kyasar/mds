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
// authentication (no middleware necessary since this is not authenticated)
// ---------------------------------------------------------
// http://localhost:8080/mds/api/authenticate
router.post('/authenticate', function(req, res) {

    if (!req.body.id || !req.body.social) {
        log.info("User ID or Login Type not specified !");
        return res.send({status: 'fail', error : "No id specified."});
    }

    query = {'social.id' : req.body.id, 'loginType' : req.body.social};

    log.info("User loginType: ", req.body.social);
    if (req.body.social == "FACEBOOK_USER") {
        log.info("User loging in with facebook account id: ", req.body.id);
    } else if (req.body.social == "GOOGLE_USER") {
        log.info("User loging in with google account id: ", req.body.id);
    } else {
        //TODO: get username and password
        return res.send({status: 'fail', error : "No Local signup yet. Use social media."});
    }

    // find the user
    User.findOne(query, function(err, user) {
        if (err) throw err;
        if (!user) {
            res.json({ status: 'fail', message: 'Authentication failed. User not found.' });
        } else if (user) {
            // check if password matches
            if (config.API_KEY == req.body.password) {
                res.json({ status: 'fail', message: 'Authentication failed. Wrong API_KEY.' });
            } else {
                // if user is found and password is right
                // create a token
                // Note! first param must be a JSON
                log.info("User ", user.firstName, " ", user.lastName, " getting a Token..");
                var token = jwt.sign({'user':user}, config.get('secret'), { expiresInMinutes: 30 });
                res.json({
                    status: 'success',
                    message: 'Enjoy your token!',
                    token: token
                });
            }
        }
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
                    return res.json({ success: false, message: 'Failed to authenticate token.' });
                } else {
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
            // if there is no token
            // return an error
            return res.status(403).send({
                status: 'fail',
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

router.get('/products/:barcode', function(req, res) {
    log.info('Searching for product with barcode:', req.params.barcode);
    return ProductModel.findOne({ barcode : req.params.barcode }, function(err, product) {
        if (!err) {
            return res.send({status: 'OK', product: product});
        } else {
            res.statusCode = 500;
            log.error('Internal error(%d): %s', res.statusCode, err.message);
            return res.send({status: 'fail', error: 'Server error' });
        }
    });
});

router.post('/products/', function(req, res) {
    var product
        = new ProductModel({
        barcodeNumber: req.body.barcode,
        name: req.body.name
    });

    product.save(function (err) {
        if (!err) {
            log.info("product created");
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
Gets a JSON object containing market details and products which will be matched with the market
Saves the market if not existing in DB, then associates the products with their prices
Method: POST, Content-Type: Application/JSON
 */

router.post('/market/', function(req, res) {

    if (!req.body.id || !req.body.provider) {
        log.info("Market ID or Login Type not specified !");
        return res.send({status: 'fail', error : "No id specified."});
    } else {
        var newMarket
            = new MarketModel({
            'name'     : req.body.name,
            'id'       : req.body.id,
            'provider' : req.body.provider,
            'vicinity' : req.body.vicinity,
            'products' : req.body.products
        });

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

            // find the user
            User.findById(userID, function(err, user) {
                if (err) throw err;
                if (!user) {
                    res.json({ status: 'fail', message: 'User not found.' });
                } else if (user) {
                    //TODO: Add points to User account
                    log.info("user: ", user.firstName, " earned ", points, " points.");
                    User.findOneAndUpdate(newMarket.userID,
                        { $inc : { 'points' : points } },
                        function (err) {
                            if (!err) {
                                log.info("User ", userID, " earned ", points, " points..");
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
                }
            });
        });
    }
});

module.exports = router;