/**
 * Created by kadir on 31.03.2016.
 */

var mongoose    = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');

var CategorySchema = new mongoose.Schema({
    name: { type: String, required: true }
});

CategorySchema.plugin(mongoosePaginate);

var CategoryModel = mongoose.model('Category', CategorySchema);
module.exports.CategoryModel = CategoryModel;