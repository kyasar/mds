/**
 * Created by kadir on 24.06.2015.
 */
var mongoose    = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');

var Schema = mongoose.Schema;

var User = new Schema({
    firstName        : { type: String},
    lastName         : { type: String},
    email            : { type: String},
    points           : { type: Number, default: 0 },
    signDate         : { type: Date, default: Date.now },
    local            : {
        password     : String
    },
    facebook         : {
        id           : String,
        token        : String
    },
    twitter          : {
        id           : String,
        token        : String,
        username     : String   // twitter username?
    },
    google           : {
        id           : String,
        token        : String
    }
});

// methods ======================
// generating a hash
User.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
User.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.local.password);
};

var UserModel = mongoose.model('User', User);
module.exports.UserModel = UserModel;