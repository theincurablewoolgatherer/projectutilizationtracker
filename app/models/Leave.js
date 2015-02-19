var mongoose = require("mongoose");

var LeaveSchema = new mongoose.Schema({
    user: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    date: Date,
    type: String,
    active: Boolean,
    filedate: Date
});

module.exports = mongoose.model('Leave', LeaveSchema);
