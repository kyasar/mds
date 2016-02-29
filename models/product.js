/**
 * Created by kadir on 24.06.2015.
 */
var mongoose    = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');

var ProductSchema = new mongoose.Schema({
    name: { type: String, required: true },
    // we will query with barcode number frequently, so let it be indexed
    barcode: { type: String, index: true, required: true },
    barcodeType: {type: String},
    modified: { type: Date, default: Date.now },
    encodedPhoto : {type: String}
});

ProductSchema.plugin(mongoosePaginate);

var ProductModel = mongoose.model('Product', ProductSchema);
module.exports.ProductModel = ProductModel;