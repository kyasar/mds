/**
 * Created by kadir on 24.06.2015.
 */

var mongoose    = require('mongoose');
var crypto = require('crypto');
var log         = require('../libs/log')(module);
var Schema = mongoose.Schema;

// Schemas
var Images = new Schema({
    kind: {
        type: String,
        enum: ['thumbnail', 'detail'],
        required: true
    },
    url: { type: String, required: true }
});

var Article = new Schema({
    title: { type: String, required: true },
    author: { type: String, required: true },
    description: { type: String, required: true },
    images: [Images],
    modified: { type: Date, default: Date.now }
});

// validation
Article.path('title').validate(function (v) {
    log.info('validating title: ', v, ' for article model');
    return v.length > 5 && v.length < 70;
});

var ArticleModel = mongoose.model('Article', Article);
module.exports.ArticleModel = ArticleModel;