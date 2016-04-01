/**
 * Created by kadir on 24.06.2015.
 */
var mongoose    = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');

var Schema = mongoose.Schema;
var mongoosePaginate = require('mongoose-paginate');

var UserSchema = new Schema({
    firstName        : { type: String },
    lastName         : { type: String },
    email            : { type: String },
    loginType        : { type: String },
    password         : { type: String }, // for only local users
    social_id        : { type: String },
    role             : { type: String, default: "user" },
    points           : { type: Number, default: 0 },
    signDate         : { type: Date, default: Date.now },
    verification     : { type: Boolean, default: false},
    verifyToken      : { type: String},
    shopLists        : [],
    following        : []
});

// methods ======================
// generating a hash
UserSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
UserSchema.methods.validPassword = function(password) {
    if (password == this.password)
        return true;
    else
        return false;
    //return bcrypt.compareSync(password, this.password);
};

UserSchema.plugin(mongoosePaginate);

var UserModel = mongoose.model('User', UserSchema);
module.exports.UserModel = UserModel;