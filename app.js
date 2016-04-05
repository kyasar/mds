var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var config      = require('./libs/config');
var log       = require('./libs/log')(module);
var session      = require('express-session');
var favicon = require('serve-favicon');
var mongoose    = require('mongoose');
require("babel-polyfill");

var app = express();
const MongoStore = require('connect-mongo')(session);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/bower_components',  express.static(__dirname + '/bower_components'));
app.use(favicon(__dirname + '/public/images/favicon.ico'));

// passport middleware initialization
// use this code before any route definitions
var passport = require('passport');
var flash = require('connect-flash');

/* app.use(function printSession(req, res, next) {
  console.log('req.session: ', req.session);
  return next();
}); */

require('./libs/passport')(passport); // pass passport for configuration
app.use(session({ secret: config.get('secret'),
                  cookie: {
                    maxAge: config.get('session-timeout')
                  },
                  /* Connection will be provided later */
                  store: new MongoStore({
                            mongooseConnection: mongoose.connection,
                            autoRemove: 'interval',
                            autoRemoveInterval: 10 // In minutes. Default
                  })
                })); // session secret
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// load our routes and pass in our app and fully configured passport
// app.use('/mds/api/', require('./routes/api_key'));

require('./routes/login.js')(app, passport);

app.use('/mds/api/products', require('./routes/products_public'));
app.use('/mds/api/users', require('./routes/users_public'));
app.use('/mds/api/markets/', require('./routes/markets_public'));
app.use('/mds/api', require('./routes/scan_api'));
/*
  Token Authentication for rest of the API
 */
app.use('/mds/api/', require('./routes/api_auth'));
/*
  Now, entering the authenticated API side
 */
app.use('/mds/api/products', require('./routes/products'));
app.use('/mds/api/users', require('./routes/users'));
app.use('/mds/api/markets/', require('./routes/markets'));
app.use('/mds/signup/', require('./routes/signup'));

// =====================================
// HOME PAGE (with login links) ========
// =====================================
app.get('/', function(req, res) {
  res.sendfile('./views/index.html'); // load the index.ejs file
  //res.send({ret:'ok'});
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// Error Handlers
// Development error handler will print stacktrace
if (process.env.NODE_ENV === 'development') {
  console.log("** Development Version **");
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
} else {
  console.log("** Production Version **");
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
