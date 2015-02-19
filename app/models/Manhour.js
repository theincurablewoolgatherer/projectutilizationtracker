var mongoose = require("mongoose");

var ManhourSchema = new mongoose.Schema({
    user: String,
    date: Date,
    timein: Date,
    timeout: Date,
    nonworking: Number,
    isOvertime: Boolean,
    otProject: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    tasks: [{
    	task: String,
    	project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    	duration: Number
    }]
});

module.exports = mongoose.model('Manhour', ManhourSchema);
