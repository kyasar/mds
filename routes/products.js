/**
 * Created by kadir on 24.06.2015.
 */

var ProductModel    = require('../libs/mongoose').ProductModel;
var log             = require('../libs/log')(module);
var express = require('express');
var router = express.Router();

router.get('/:barcode', function(req, res) {
    log.info('Searching for product with barcode:', req.params.barcode);
    return ProductModel.find({ barcodeNumber : req.params.barcode }, function(err, product) {
        if (!err) {
            return res.send(product);
        } else {
            res.statusCode = 500;
            log.error('Internal error(%d): %s',res.statusCode,err.message);
            return res.send({ error: 'Server error' });
        }
    });
});

router.get('/', function(req, res) {
    return ProductModel.find( function(err, products) {
        if (!err) {
            return res.send(products);
        } else {
            res.statusCode = 500;
            log.error('Internal error(%d): %s',res.statusCode,err.message);
            return res.send({ error: 'Server error' });
        }
    });
});

router.post('/', function(req, res) {
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