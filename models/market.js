/**
 * Created by kadir on 02.08.2015.
 */
var mongoose    = require('mongoose');
var Schema = mongoose.Schema;

var Market = new Schema({
    name: { type: String, required: true },
    id: { type: String, index: true, required: true },
    provider: { type: String, required: true },
    modified: { type: Date, default: Date.now }
});

var MarketModel = mongoose.model('Market', Market);
module.exports.MarketModel = MarketModel;