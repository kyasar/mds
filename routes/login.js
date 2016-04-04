/**
 * Created by kadir on 24.06.2015.
 */
module.exports = function(app, passport) {

    app.get('/manager', isLoggedIn, function(req, res) {
        //res.sendfile('./views/manager.html'); // load the index.ejs file
        if (req.session && req.session.passport.user) {
            console.log("REQ Session: ", req.session, " user id: ", req.session.passport.user);
        }
        res.sendfile('./views/manager.html');
    });

    // =====================================
    // LOGIN ===============================
    // =====================================
    // show the login form

    app.get('/login-fail', function(req, res) {
        res.send({ status:'fail', message: req.flash('loginMessage') });
    });

    app.get('/login-succ', function(req, res) {
        //TODO: If user is normal, redirect to profile page or what else..
        if (req.user.role == "theboss" && req.user.email == "kyasar07@gmail.com") {
            return res.send({status: 'OK', user: req.user, redirect: '/manager'});  // req.user comes from strategy return
        } else {
            return res.send({status: 'OK', user: req.user, redirect: '/'});  // req.user comes from strategy return
        }
    });

    app.get('/logout', function(req, res) {
        if (req.session) {
            req.session.destroy(function (err) {
                if (!err) {
                    console.log("Session is destroyed.");
                    req.logout();
                    res.send({status: 'OK', message: "logout is successful", redirect: '/'})
                }
            });
        }
    });

    // process the login form
    app.post('/login', passport.authenticate('local-login', {
        successRedirect : '/login-succ', // redirect to the secure profile section
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

        res.send({ret:'signup failed', message: req.flash('signupMessage')});
    });

    // =====================================
    // PROFILE SECTION =====================
    // =====================================
    // we will want this protected so you have to be logged in to visit
    // we will use route middleware to verify this (the isLoggedIn function)
    app.get('/signup', function(req, res) {
        res.send({ret:'signup ok', message: req.flash('signupMessage')});
    });

};

// route middleware to make sure a user is logged in
// If it is already logged in, pass login phase
function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on
    if (req.isAuthenticated()) {
        console.log("Already logged in.");
        return next();
    }

    // if they aren't redirect them to the home page
    res.redirect('/');
    //res.send({ret:'auth ok'});
}