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
router.get('/', function(req, res) {
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

router.get('/all', function(req, res) {
    if (!req.query.page || !req.query.limit) {
        return res.send({status: 'fail', error: 'No such API usage.' });
    }
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
router.get('/:barcode', function(req, res) {
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

router.delete('/:barcode', function(req, res) {
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

router.put('/:barcode', function(req, res) {
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

module.exports = router;