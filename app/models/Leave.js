var mongoose = require("mongoose");

var LeaveSchema = new mongoose.Schema({
    user: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    date: Date,
    type: String,
    active: Boolean,
    remarks: String,
    filedate: Date
});

module.exports = mongoose.model('Leave', LeaveSchema);
