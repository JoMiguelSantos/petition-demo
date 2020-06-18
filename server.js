const express = require("express");
const handlebars = require("express-handlebars");
const db = require("./db");
const app = express();
const qs = require("querystring");
const cookieSession = require("cookie-session");
const csurf = require("csurf");
const { hashPassword, comparePassword } = require("./bc");

app.use(
    cookieSession({
        secret: `tabs rule`,
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
    res.locals.csrfToken = req.csrfToken();
    next();
});

app.engine("handlebars", handlebars());
app.set("view engine", "handlebars");

app.get("/", (req, res) => {
    res.render("homepage", { loggedin: !!req.session.userId });
});

app.get("/petition", (req, res) => {
    console.log("petition get", req.session.userId, req.session.signatureId);

    if (req.session.userId && req.session.signatureId) {
        console.log("petition all good");

        return res.redirect("/signers");
    } else if (req.session.userId) {
        console.log("check if signature");

        db.readSignature({ user_id: req.session.userId }).then((data) => {
            console.log("read sig petition", data.rows, data.rows.length);

            if (data.rows.length === 1) {
                req.session.signatureId = data.rows[0].id;
                return res.redirect("/signers");
            } else {
                const err = qs.parse(req.url.split("?")[1])["err"];

                if (err === "true") {
                    return res.render("petition", {
                        err:
                            "Oh nooo, something went wrong, please resubmitted your signature :(",
                        layout: "signature",
                        user: {
                            first: req.session.first,
                            last: req.session.last,
                        },
                    });
                } else {
                    return res.render("petition", {
                        err: "",
                        layout: "signature",
                        user: {
                            first: req.session.first,
                            last: req.session.last,
                        },
                    });
                }
            }
        });
    } else {
        return res.redirect("/signup");
    }
});

app.post("/petition", (req, res) => {
    db.createSignature({ ...req.body, user_id: req.session.userId })
        .then((data) => {
            req.session.signatureId = data.rows[0].id;
            return res.redirect("/thanks");
        })
        .catch(() => {
            return res.redirect("/petition?err=true");
        });
});

app.get("/login", (req, res) => {
    const err = qs.parse(req.url.split("?")[1])["err"];

    if (err === "true") {
        res.render("login", { err: "Your email or password is not correct" });
    } else {
        res.render("login", { err: "" });
    }
});

app.post("/login", (req, res) => {
    console.log("login post", req.body);

    return db.readUser({ email: req.body.email }).then((data) => {
        console.log("login readUser", req.body.password, data.rows[0].password);

        comparePassword(req.body.password, data.rows[0].password).then(
            (check) => {
                if (check) {
                    console.log("check pass", check);

                    req.session.userId = data.rows[0].id;
                    req.session.first = data.rows[0].first;
                    req.session.last = data.rows[0].last;
                    return res.redirect("/petition");
                } else {
                    return res.redirect("/login?err=true");
                }
            }
        );
    });
});

app.get("/logout", (req, res) => {
    req.session = null;
    res.redirect("/");
});

app.get("/signup", (req, res) => {
    const err = qs.parse(req.url.split("?")[1])["err"];

    if (err === "true") {
        return res.render("signup", {
            err:
                "One of your fields were not correctly field in, please check them and resubmit.",
        });
    } else {
        return res.render("signup", { err: "" });
    }
});

app.post("/signup", (req, res) => {
    hashPassword(req.body.password).then((hashedPw) => {
        return db
            .createUser({ ...req.body, password: hashedPw })
            .then((data) => {
                req.session.userId = data.rows[0].id;
                req.session.first = data.rows[0].first;
                req.session.last = data.rows[0].last;
                return res.redirect("/petition");
            })
            .catch(() => {
                return res.redirect("/signup?err=true");
            });
    });
});

app.get("/thanks", (req, res) => {
    if (req.session.signatureId) {
        return db
            .readSignature({ id: req.session.signatureId })
            .then((data) => {
                return res.render("thanks", {
                    signature: data.rows[0].signature,
                });
            })
            .catch((err) => console.log(err));
    }
});

app.get("/signers", (req, res) => {
    return db
        .readAllSignatures()
        .then((result) => {
            return res.render("signers", { signers: result.rows });
        })
        .catch(() => res.sendStatus(500));
});

app.listen(8080, () => console.log("listening"));
