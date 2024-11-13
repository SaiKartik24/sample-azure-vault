const express = require("express");
const passport = require("passport");
const { initPassport } = require("../passport-config");

initPassport();

const router = express.Router();

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});

router.get('/login', passport.authenticate('azuread-openidconnect'));

router.get('/logout', function(req, res, next){
    req.logout((err) => {
        if(err) {
            return next(err);
        }
        req.session.destroy(() => {
            res.redirect(process.env.APPLICATION_URL);
        });
    });
});

router.post('/auth/callback',
    passport.authenticate('azuread-openidconnect', {
        failureRedirect : '/auth-failure'
    }),
    regenerateSessionAfterAuthentication,
    function (req, res) {
     res.redirect(`${process.env.APPLICATION_URL}`);
    }
);

router.get('/auth-success', (req, res) => {
 const token = req?.user?._json?.email;
 const name = req?.user?._json?.given_name;
 res.redirect(`${process.env.APPLICATION_URL}`);
});

router.get('/auth-failure', (req, res) => {
 res.status(401).json({ message: 'Authentication failed' });
});

router.get('/getLoggedInUser', (req, res) => {
    if(req.session.passport){
        res.json({
            username: req.session.passport.user?.displayName,
            email: req.session.passport.user?._json?.email
        });
    } else {
        res.json({ username: null, email: null });
    }
});

function regenerateSessionAfterAuthentication (req, res, next) {
    var passportInstance = req.session.passport;
    return req.session.regenerate((err) => {
        if (err) {
            return next(err);
        }
        req.session.passport = passportInstance;
        req.session.isAuthenticated = true;
        return req.session.save(next);
    });
}

module.exports = router;
