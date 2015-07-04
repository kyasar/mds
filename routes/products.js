/**
 * Created by kadir on 24.06.2015.
 */

var ProductModel    = require('../libs/mongoose').ProductModel;
var User    = require('../libs/mongoose').UserModel;
var log     = require('../libs/log')(module);
var jwt     = require('jsonwebtoken'); // used to create, sign, and verify tokens
var config  = require('../libs/config');
var express = require('express');
var router  = express.Router();

// ---------------------------------------------------------
// authentication (no middleware necessary since this is not authenticated)
// ---------------------------------------------------------
// http://localhost:8080/mds/api/authenticate
router.post('/authenticate', function(req, res) {

    // find the user
    User.findOne({
        'local.email': req.body.email
    }, function(err, user) {
        if (err) throw err;
        if (!user) {
            res.json({ success: false, message: 'Authentication failed. User not found.' });
        } else if (user) {
            // check if password matches
            if (!user.validPassword(req.body.password)) {
                res.json({ success: false, message: 'Authentication failed. Wrong password.' });
            } else {
                // if user is found and password is right
                // create a token
                // Note! first param must be a JSON
                var token = jwt.sign({'user':user}, config.get('secret'), { expiresInMinutes: 1 });
                res.json({
                    success: true,
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
            success: false,
            message: 'No token provided.'
        });
    }
});

router.get('/products/', function(req, res) {
    log.info('user email: ', req.decoded.user.local.email);
    return ProductModel.find( function(err, products) {
        if (!err) {
            return res.send(products);
        } else {
            res.statusCode = 500;
            log.error('Internal error(%d): %s', res.statusCode, err.message);
            return res.send({ error: 'Server error' });
        }
    });
});

router.get('/products/:barcode', function(req, res) {
    log.info('user email: ', req.decoded.user.local.email);
    log.info('Searching for product with barcode:', req.params.barcode);
    return ProductModel.find({ barcodeNumber : req.params.barcode }, function(err, product) {
        if (!err) {
            return res.send(product);
        } else {
            res.statusCode = 500;
            log.error('Internal error(%d): %s', res.statusCode, err.message);
            return res.send({ error: 'Server error' });
        }
    });
});

router.post('/products/', function(req, res) {
    log.info('user email: ', req.decoded.user.local.email);
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
                res.send({ error: 'Validation error' });
            } else {
                res.statusCode = 500;
                res.send({ error: 'Server error' });
            }
            log.error('Internal error(%d): %s', res.statusCode, err.message);
        }
    });
});

module.exports = router;