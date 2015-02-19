var mongoose = require("mongoose");

var HolidaySchema = new mongoose.Schema({
    date: Date,
    name: String
});

module.exports = mongoose.model('Holiday', HolidaySchema);
