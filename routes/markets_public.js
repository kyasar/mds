/**
 * Created by kadir on 02.04.2016.
 */

var MarketModel    = require('../libs/mongoose').MarketModel;
var UserModel      = require('../libs/mongoose').UserModel;
var log     = require('../libs/log')(module);
var config  = require('../libs/config');
var express = require('express');
var router  = express.Router();

router.get('/all', function(req, res) {
    if (!req.query.page || !req.query.limit) {
        return res.send({status: 'fail', error: 'No such API usage.' });
    }

    log.info("All markets requested. Page: ", req.query.page, " Limit: ", req.query.limit);
    return MarketModel.paginate({}, { select: 'name _id id provider vicinity loc',
            page: req.query.page, limit: req.query.limit },
        function(err, markets) {
            if (!err) {
                return res.send({ status: 'OK', markets: markets });
            } else {
                res.statusCode = 500;
                log.error('Internal error(%d): %s', res.statusCode, err.message);
                return res.send({status: 'fail', error: 'Server error' });
            }
        });
});

router.delete('/:_id', function(req, res) {
    log.info('Removing market with _id: ', req.params._id);
    if (req.params._id)

    return MarketModel.findByIdAndRemove(req.params._id, function(err, market) {
        if (!err) {
            if (market) {
                log.info("Market found, name: ", market.name, " will be removed from DB.");
                return res.send({ status: 'OK', market: market });
                /*market.remove(function (err, user) {
                    if (!err) {
                        log.info("market removed in server side (from DB)");
                        return res.send({status: 'OK'});
                    } else {
                        res.statusCode = 500;
                        log.error('Internal error(%d): %s', res.statusCode, err.message);
                        return res.send({status: 'fail', error: 'Server error'});
                    }
                });*/
            } else {
                log.info("No such market (", req.params._id, ") !");
                return res.send({status: 'fail', error: 'No such market' });
            }
        } else {
            res.statusCode = 500;
            log.error('Internal error(%d): %s', res.statusCode, err.message);
            return res.send({status: 'fail', error: 'Server error' });
        }
    });
});

router.get('/nearby/', function(req, res) {
    if (!req.query.long || !req.query.lat || !req.query.max_dist) {
        log.info("No Lat or Long info specified !");
        return res.send({status: 'fail', error: "No location specified."});
    }
    log.info("long:", req.query.long, " lat:", req.query.lat, " max_dist:", req.query.max_dist);

    MarketModel.find({ loc : { $near : { $geometry : { type : "Point" ,
            coordinates : [req.query.lat, req.query.long] },
            $maxDistance : parseInt(req.query.max_dist) } } },
        { name : 1, loc : 1, vicinity: 1, _id : 0 },
        function (err, markets) {
            if (!err)
            {
                log.info("Markets number: ", markets.length);
                res.send({'status': 'OK', 'markets' : markets});
            }
            else
            {
                res.statusCode = 500;
                log.error('Internal error(%d): %s', res.statusCode, err.message);
                return res.send({status: 'fail', error: 'Server error'});
            }
        });
});

module.exports = router;