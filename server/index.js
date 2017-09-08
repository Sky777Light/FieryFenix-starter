const hbs = require("hbs");
const path = require("path");
const http = require("http");
const morgan = require("morgan");
const express = require("express");
const passport = require("passport");
const session = require("express-session");
const busboy = require("connect-busboy");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");

const proxy = require("express-http-proxy");
const MongoStore = require("connect-mongo")(session);

const mongoose = require("./middleware/mongoose");

const config = require("./config");
const routes = require("./routes");

const app = express();
const server = http.createServer(app);

hbs.localsAsTemplateData(app);
hbs.registerPartials(path.join(__dirname, "views/partials"));

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "hbs");
app.set("view options", {
    layout: "layout"
});


app.use(morgan("dev"));

app.use(busboy());

app.use(cookieParser());

app.use(bodyParser.urlencoded({
    limit: "50mb",
    extended: false
}));

app.use(bodyParser.json({ limit: "50mb" }));

app.use(session({
    secret: config.security.secret,
    resave: true,
    saveUninitialized: true,
    store: new MongoStore({
        mongooseConnection: mongoose.connection
    })
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(express.static(path.join(__dirname, "../dist")));
app.use(express.static(path.join(__dirname, "../resources")));

app.use("/", routes);

app.use("*", function (req, res) {
    res.sendFile(path.join(__dirname, "../dist/index.html"));
});

app.use(function (req, res, next) {
    let err = new Error("Not Found");
    err.status = 404;

    next(err);
});

if (app.get("env") === "development") {
    app.use( (err, req, res, next) => {
        res.status(err.status || 500);

        res.render("error", {
            message: err.message,
            error: err
        });
    });
}

app.use( (err, req, res, next) => {
    res.status(err.status || 500);

    res.render("error", {
        message: err.message,
        error: {}
    });
});

server.on("listening", () => {
    let addr = server.address();
    let bind = typeof addr === "string" ? "pipe " + addr : "port " + addr.port;

    console.log("Listening on " + bind);
});

server.on("error", (error) => {
    if (error.syscall !== "listen") throw error;

    let bind = typeof config.port === "string" ? "Pipe " + config.port : "Port " + config.port;

    switch (error.code) {
        case "EACCES":
            console.error(bind + " requires elevated privileges");
            process.exit(1);
            break;
        case "EADDRINUSE":
            console.error(bind + " is already in use");
            process.exit(1);
            break;
        default:
            throw error;
    }
});

server.listen(config.port);

require("./middleware/passport")(passport);
