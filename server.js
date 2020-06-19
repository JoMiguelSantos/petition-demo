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
    if (req.session.userId && req.session.signatureId) {
        return res.redirect("/signers");
    } else if (req.session.userId) {
        db.readSignature({ user_id: req.session.userId }).then((data) => {
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
    return db.readUser({ email: req.body.email }).then((data) => {
        comparePassword(req.body.password, data.rows[0].password).then(
            (check) => {
                if (check) {
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
                return res.redirect("/profile");
            })
            .catch(() => {
                return res.redirect("/signup?err=true");
            });
    });
});

app.get("/profile", (req, res) => {
    res.render("profile");
});

app.post("/profile", (req, res) => {
    let { age, city, url } = req.body;
    city = city.toLowerCase();
    const user_id = req.session.userId;
    let data;
    if (/^https?:\/\//.test(url)) {
        data = { user_id, age, city, url };
    } else {
        data = { user_id, age, city };
    }
    // check if profiles exists and update if so else create
    db.createProfile(data).then(() => res.redirect("/petition"));
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
        .readAllSignatures({})
        .then((result) => {
            return res.render("signers", {
                signers: result.rows,
                helpers: {
                    toLowerCase(str) {
                        return str.toLowerCase();
                    },
                    capitalize(text, separator = "-") {
                        return text
                            .split(separator)
                            .map(
                                (word) =>
                                    word.charAt(0).toUpperCase() + word.slice(1)
                            )
                            .join(" ");
                    },
                },
            });
        })
        .catch(() => res.sendStatus(500));
});

app.get("/signers/:city", (req, res) => {
    const { city } = req.params;
    db.readAllSignatures({ city })
        .then((result) => {
            return res.render("signers", {
                signers: result.rows,
                city: true,
                helpers: {
                    toLowerCase(str) {
                        return str.toLowerCase();
                    },
                    capitalize(text, separator = "-") {
                        return text
                            .split(separator)
                            .map(
                                (word) =>
                                    word.charAt(0).toUpperCase() + word.slice(1)
                            )
                            .join(" ");
                    },
                },
            });
        })
        .catch(() => res.sendStatus(500));
});

app.listen(8080, () => console.log("listening"));
