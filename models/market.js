/**
 * Created by kadir on 02.08.2015.
 */
var mongoose    = require('mongoose');
var Schema = mongoose.Schema;
var mongoosePaginate = require('mongoose-paginate');

var MarketSchema = new Schema({
    name     : { type: String, required: true },
    id       : { type: String, index: true, required: true },
    provider : { type: String, required: true },
    modified : { type: Date, default: Date.now },
    vicinity : { type: String },
    //loc      : { type: [Number], index: '2dsphere' },
    loc : {
        type: {
            type: String,
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            default: [0,0]
        }
    },

    /* This array contains the the products that are sold in this market
     * De-normalized database
     */
    products : [],
    followers: []
});

MarketSchema.index({loc : '2dsphere'});
MarketSchema.plugin(mongoosePaginate);

var MarketModel = mongoose.model('Market', MarketSchema);
module.exports.MarketModel = MarketModel;