var express = require('express');
var app = express.Router();
var passport = require('passport');
var constants = require('../utils/constants');

//========================================================
// I. Controller actions
//========================================================
showManhourView = function(req, res){
	if(req.isAuthenticated())
		res.render('manhour', { title: 'Utilization Tracker', isManager: req.user.usertype == constants.USERTYPE_PROJECT_MANAGER });
	else
    	res.render('login', { title: 'Utilization Tracker' });
}


//========================================================
// II. Controller URL to Action mapping
//========================================================
app.get('/', showManhourView);

module.exports = app;
