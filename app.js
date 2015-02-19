var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var passport = require('passport');
var logger = require('morgan');
var session      = require('express-session');
var fs = require('fs');

// Require Controllers
var apiController = require('./app/controllers/api');
var adminController = require('./app/controllers/AdminController');
var loginController = require('./app/controllers/LoginController');
var manhourController = require('./app/controllers/ManhourController');
var reportController = require('./app/controllers/ReportController');
var app = express();

// ===================================================
// Configuration 
// ===================================================
// mongoDb connection through mongoose
mongoose.connect('mongodb://root:1234@localhost:27017/manhours?authSource=admin')

app.use(logger('dev'));
app.set('views', path.join(__dirname, '/app/views'));
app.set('view engine', 'jade');
app.use(favicon(__dirname + '/public/images/favicon.png'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
// Required for Authentication Middleware using Passport
require('./sec_modules/authentication')(passport);
app.use(session({secret: 'obladioblada', 
                 saveUninitialized: true,
                 resave: true})); // session secret
app.use(passport.initialize());
app.use(passport.session());



// ===================================================
// Routes 
// ===================================================
app.use('/api', apiController);
app.use('/admin', adminController);
app.use('/manhour', manhourController);
app.use('/reports', reportController);
app.use('/', loginController);

// Protect routes
function isAuthenticated(req, res, next) {
    if (!req.isAuthenticated()){
        res.redirect('/');
    }
}

/// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

module.exports = app;
