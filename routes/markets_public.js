/**
 * Created by kadir on 02.04.2016.
 */

var MarketModel    = require('../libs/mongoose').MarketModel;
var UserModel      = require('../libs/mongoose').UserModel;
var log     = require('../libs/log')(module);
var config  = require('../libs/config');
var express = require('express');
var router  = express.Router();

router.get('/', function(req, res) {
    log.info('Searching for markets');
    return MarketModel.find({ }, function(err, markets) {
        if (!err) {
            return res.send({status: 'OK', markets: markets});
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