var express = require('express');
var app = express.Router();
var passport = require('passport');
var constants = require('../utils/constants');

//========================================================
// I. Controller actions
//========================================================
showAdminView = function(req, res){
	if(req.isAuthenticated())
		res.render('admin', { title: 'Utilization Tracker' , isManager: req.user.usertype == constants.USERTYPE_PROJECT_MANAGER });
	else
    	res.render('login', { title: 'Utilization Tracker' });

}

function isAdmin(req, res, next) {
    if (req.user && req.user.usertype != constants.USERTYPE_PROJECT_MANAGER){
    	var err = new Error('Forbidden');
	    err.status = 403;
	    return next(err);
    }
    return next();
}
//========================================================
// II. Controller URL to Action mapping
//========================================================
app.get('/', isAdmin, showAdminView);

module.exports = app;
