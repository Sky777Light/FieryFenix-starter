const jwt = require("jwt-simple");

const LocalStrategy = require("passport-local").Strategy;
const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;

const config = require("../config");

const User = require("../models/user");

module.exports = (passport) => {
    passport.serializeUser( (user, done) => {
        done(null, user);
    });

    passport.deserializeUser( (id, done) => {
        User.findById(id, (err, user) => {
            done(err, user);
        });
    });

    passport.use(new LocalStrategy({
        usernameField: "login",
        passwordField: "password",
        passReqToCallback: true
    },  (req, login, password, done) => {
        console.log(login, "passport1");
        User.findOne({$or:[ {login: login}, {email: login}]}, (err, user) => {
            if (err) return done(err);

            if (!user) return done(null, null, { status: false, message: "No user found." });

            if (!user.comparePassword(password)) return done(null, null, { status: false, message: "Oops! Wrong password." });

            user.token = "JWT " + jwt.encode({ _id: user._id, username: user.username }, config.security.secret);
            user.save( (err, user) => {
                done(null, user, {
                    status: true,
                    message: "Login success."
                });
            });
        });
    }));

    passport.use(new JwtStrategy({
        secretOrKey: config.security.secret,
        jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme('jwt')
    },  function(payload, done) {
        User.findOne({ id: payload.id }, (err, user) => {
            if (err) return done(err, false);

            if (!user) {
                return done(null, false, {
                    status: false,
                    message: "Failed to authenticate token."
                });
            }

            done(null, user, {
                status: true,
                message: "Authenticate success."
            });
        });
    }));
};
