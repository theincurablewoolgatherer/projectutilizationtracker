var mongoose = require("mongoose");

var ProjectSchema = new mongoose.Schema({
    name: String,
    manager: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    members: [],
    tasks: [{task : String}]
});

module.exports = mongoose.model('Project', ProjectSchema);
