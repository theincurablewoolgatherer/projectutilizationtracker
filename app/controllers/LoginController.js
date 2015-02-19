var express = require('express');
var app = express.Router();
var passport = require('passport');
//========================================================
// I. Controller actions
//========================================================
showLoginView = function(req, res){
	if(req.isAuthenticated())
		res.redirect('/manhour');
	else
    	res.render('login', { title: 'Utilization Tracker' });
}

doLogin = function(req, res) {
  
  res.send(req.user);

}

doLogout = function(req, res){
    req.session.destroy(function (err) {
        res.redirect('/');
    });
}

getLoggedUser = function(req, res){
    res.send(req.isAuthenticated() ? req.user : '0');
}

showPartial = function (req, res) { 
   var view = req.params.view;
   res.render('partials/' + view);
}
//========================================================
// II. Controller URL to Action mapping
//========================================================
app.get('/', showLoginView);
app.get('/login', showLoginView);
app.post('/login', passport.authenticate('local'), doLogin);
app.get('/logout', doLogout);
app.get('/loggeduser', getLoggedUser);

// route to resolve angular partials
app.get('/partials/:view', showPartial);

module.exports = app;
