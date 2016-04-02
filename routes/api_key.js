/**
 * Created by kadir on 02.04.2016.
 */
var UserModel    = require('../libs/mongoose').UserModel;
var log     = require('../libs/log')(module);
var config  = require('../libs/config');
var express = require('express');
var router  = express.Router();

// ---------------------------------------------------------
// route middleware to authenticate and check API key
// a middleware with no mount path; gets executed for every request to the app
// ---------------------------------------------------------
/*
router.use(function(req, res, next) {

    // check header or url parameters or post parameters for token
    var key = req.body.api_key || req.query.api_key;

    if (key == "test") {
        log.info("Test API key..");
        next();
    } else {

        if (key) {
            // verifies API key
            if (config.get("API_KEY") == key) {
                // Auth is OK, pass control to the next middleware
                next();
            } else {
                log.info("API key wrong :(");
                return res.json({status: 'FAIL'});
            }
        } else {
            log.info("No API key provided :(");
            // if there is no token
            // return an error
            return res.json({
                status: 'FAIL'
            });
        }
    }
});
*/

module.exports = router;