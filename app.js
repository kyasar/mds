var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var config      = require('./libs/config');
var log       = require('./libs/log')(module);
var session      = require('express-session');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// passport middleware initialization
// use this code before any route definitions
var passport = require('passport');
var flash = require('connect-flash');

require('./libs/passport')(passport); // pass passport for configuration
app.use(session({ secret: config.get('secret'),
  cookie:{maxAge: config.get('session-timeout')} })); // session secret
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// load our routes and pass in our app and fully configured passport
require('./routes/login.js')(app, passport);

app.get('/', function(req, res) {
      return res.send({status: 'OK !'});
});

app.use('/mds/api/', require('./routes/products'));
app.use('/mds/api/market/', require('./routes/markets'));
app.use('/mds/signup/', require('./routes/signup'));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// Error Handlers
// Development error handler will print stacktrace
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

app.listen(config.get('port'), function(){
  log.info('Express server listening on port ' + config.get('port'));
});


/*
var https = require('https');
var fs = require('fs');
https.createServer({
    key: fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.pem')
  }, app).listen(config.get('port'), function() {
    log.info('Express server listening on port ' + config.get('port'));
});
*/

module.exports = app;
