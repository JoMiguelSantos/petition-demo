const express = require("express");
const handlebars = require("express-handlebars");
const db = require("./db");
const app = express();

exports.app = app;

// middlewares
const cookieSession = require("cookie-session");
const csurf = require("csurf");
const helmet = require("helmet");

// routers
const petitionRouter = require("./routes/petition");
const authRouter = require("./routes/auth");
const profileRouter = require("./routes/profile");
const signersRouter = require("./routes/signers");

app.use(helmet());
app.use(
    cookieSession({
        secret:
            process.env.cookieSecret || require("./secrets.json").cookieSecret,
        maxAge: 1000 * 60 * 60 * 24 * 14,
    })
);
app.use(express.static("public"));
app.use(
    express.urlencoded({
        extended: false,
    })
);
app.use(csurf());
app.use(function (req, res, next) {
    res.set("x-frame-options", "deny");
    res.locals.csrfToken = req.csrfToken();
    next();
});
app.use(function (req, res, next) {
    if (req.session.userId) {
        next();
    } else if (
        [
            "/auth/login",
            "/auth/logout",
            "/auth/signup",
            "/",
            "/signers",
        ].includes(req.url.split("?")[0])
    ) {
        next();
    } else {
        res.redirect("/");
    }
});
app.use(/^\/auth(\/signup|\/login)/, function (req, res, next) {
    if (req.session.userId) {
        res.redirect("/");
    } else {
        next();
    }
});

app.engine("handlebars", handlebars());
app.set("view engine", "handlebars");

app.get("/", (req, res) => {
    res.render("homepage", {
        home: true,
        loggedin: !!req.session.userId,
        signed: !!req.session.signatureId,
    });
});

app.use("/petition", petitionRouter);

app.use("/auth", authRouter);

app.use("/profile", profileRouter);

app.use("/signers", signersRouter);

app.get("/thanks", (req, res) => {
    if (req.session.signatureId) {
        return db
            .readSignature({ id: req.session.signatureId })
            .then((data) => {
                return res.render("thanks", {
                    signature: data.rows[0].signature,
                    loggedin: !!req.session.userId,
                    signed: !!req.session.signatureId,
                });
            })
            .catch(() => res.sendStatus(500));
    } else {
        res.redirect("/petition");
    }
});

app.post("/signature", (req, res) => {
    db.deleteSignature({ user_id: req.session.userId })
        .then(() => {
            req.session.signatureId = null;
            return res.redirect("/petition");
        })
        .catch(() => res.sendStatus(500));
});

if (require.main == module) {
    app.listen(process.env.PORT || 8080, () => console.log("listening"));
}
