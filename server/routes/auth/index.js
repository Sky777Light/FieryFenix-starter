const passport = require("passport");
const router = require("express").Router();
const jwt = require("jwt-simple");

const config = require("../../config");

const User = require("../../models/user");

router.post("/isauth/:token", (req, res, next) => {
    if(req.user && (req.params.token === req.user.token)){
        res.json({status: true});
    } else {
        res.json({
            status: false,
            message: "You are not logged in."
        });
    }
});

router.post("/login", (req, res, next) => {
    let passportCtrl = () => {
        passport.authenticate("local", (err, user, info) => {
            if (err) throw err;

            if (!user) return res.json({ status: false, message: "Incorrect username or password." });

            req.login(user, (err) => {
                if (err) throw err;

                res.json({
                    status: true,
                    message: "Login success.",
                    user: user
                });
            });
        })(req, res, next);
    };

    if((req.body.login === config.superadmin.login || req.body.login === config.superadmin.email)
      && (req.body.password === config.superadmin.password)){
        User.findOne({$or:[ {login: req.body.login}, {email: req.body.login}]}, (err, user) => {
            if (err) throw err;

            if(user){
                passportCtrl();
            } else {

              new User({
                    login: config.superadmin.login,
                    email: config.superadmin.email,
                    password: config.superadmin.password,
                    firstName: "Super",
                    secondName: "User"
                })
                .save( (err, user) => {
                  if (err) return err;

                  user.token = "JWT " + jwt.encode({_id: user._id, email: user.email}, config.security.secret);
                    user.save( (err, user) => {
                        if (err) return err;

                        passportCtrl();
                    });
                });

            }
        });

    } else {
        passportCtrl();
    }

});

router.post("/logout", (req, res) => {
    if (!req.isAuthenticated()) {
        return res.json({
            status: false,
            message: "You are not logged in."
        });
    }

    req.user.token = "";

    req.user.save( (err, user) => {
        if(err) return err;

        req.logout();

        res.json({
            status: true,
            message: "Logout success."
        });
    });
});

module.exports = router;
