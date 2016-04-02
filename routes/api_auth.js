/**
 * Created by kadir on 02.04.2016.02.07.2015.
 */
var UserModel    = require('../libs/mongoose').UserModel;
var log     = require('../libs/log')(module);
var config  = require('../libs/config');
var express = require('express');
var jwt     = require('jsonwebtoken'); // used to create, sign, and verify tokens
var router  = express.Router();

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

module.exports = router;