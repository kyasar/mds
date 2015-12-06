/**
 * Created by kadir on 02.08.2015.
 */
var mongoose    = require('mongoose');
var Schema = mongoose.Schema;

var Market = new Schema({
    name     : { type: String, required: true },
    id       : { type: String, index: true, required: true },
    provider : { type: String, required: true },
    modified : { type: Date, default: Date.now },
    vicinity : { type: String },
    loc      : { type: [Number], index: '2d' },
    /* This array contains the the products that are sold in this market
     * De-normalized database
     */
    products : []
});

var MarketModel = mongoose.model('Market', Market);
module.exports.MarketModel = MarketModel;