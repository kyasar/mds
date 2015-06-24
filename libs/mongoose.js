/**
 * Created by kadir on 20.06.2015.
 */
var mongoose    = require('mongoose');
var log         = require('./log')(module);
var config      = require('./config');
var crypto = require('crypto');
var user        = require('../models/user.js');

mongoose.connect(config.get('mongoose:uri'));
var db = mongoose.connection;

db.on('error', function (err) {
    log.error('connection error:', err.message);
});

db.once('open', function callback () {
    log.info("Connected to DB!");
});

var ArticleModel = require('../models/article.js').ArticleModel;
var UserModel = require('../models/user.js').UserModel;
var ProductModel = require('../models/product.js').ProductModel;

module.exports.ArticleModel = ArticleModel;
module.exports.UserModel = UserModel;
module.exports.ProductModel = ProductModel;