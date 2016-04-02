/**
 * Created by kadir on 24.06.2015.
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
var log     = require('../libs/log')(module);
var config  = require('../libs/config');
var _ = require('underscore');
var express = require('express');
var router  = express.Router();
var async = require('async');
var sleep = require('sleep');

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
    productUpdateObj.modified = new Date().toISOString();

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

module.exports = router;