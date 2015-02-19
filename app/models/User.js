var mongoose = require("mongoose");

var UserSchema = new mongoose.Schema({
    username: String,
    firstname: String,
    lastname: String,
    usertype: String
});

module.exports = mongoose.model('User', UserSchema);
