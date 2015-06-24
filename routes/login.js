/**
 * Created by kadir on 24.06.2015.
 */
module.exports = function(app, passport) {

    // =====================================
    // HOME PAGE (with login links) ========
    // =====================================
    app.get('/', function(req, res) {
        //res.render('index.ejs'); // load the index.ejs file
        res.send({ret:'ok'});
    });

    // =====================================
    // LOGIN ===============================
    // =====================================
    // show the login form
    app.get('/login', function(req, res) {

        // render the page and pass in any flash data if it exists
        res.send({ret:'login ok', message: req.flash('loginMessage') });
    });

    app.get('/login-fail', function(req, res) {

        // render the page and pass in any flash data if it exists
        //res.render('login.ejs', { message: req.flash('loginMessage') });
        res.send({ret:'login fail', message: req.flash('loginMessage') });
    });

    // process the login form
    app.post('/login', isLoggedIn, passport.authenticate('local-login', {
        successRedirect : '/login', // redirect to the secure profile section
        failureRedirect : '/login-fail', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));

    // =====================================
    // SIGNUP ==============================
    // =====================================
    // process the login form
    // app.post('/login', do all our passport stuff here);
    // process the signup form
    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect : '/signup', // redirect to the secure profile section
        failureRedirect : '/signup-fail', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));

    // show the signup form
    app.get('/signup-fail', function(req, res) {

        // render the page and pass in any flash data if it exists
        //res.render('signup.ejs', {  });
        res.send({ret:'signup failed', message: req.flash('signupMessage')});
    });

    // =====================================
    // PROFILE SECTION =====================
    // =====================================
    // we will want this protected so you have to be logged in to visit
    // we will use route middleware to verify this (the isLoggedIn function)
    app.get('/signup', function(req, res) {
        //res.render('profile.ejs', {user : req.user});
        res.send({ret:'signup ok', message: req.flash('signupMessage')});
    });

    // =====================================
    // LOGOUT ==============================
    // =====================================
    app.get('/logout', function(req, res) {
        req.logout();
        res.send({ret:'logout ok.'});
    });
};

// route middleware to make sure a user is logged in
// If it is already logged in, pass login phase
function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on
    if (!req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    //res.redirect('/');
    res.send({ret:'auth ok'});
}