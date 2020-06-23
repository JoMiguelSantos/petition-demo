const express = require("express");
const handlebars = require("express-handlebars");
const db = require("./db");
const app = express();
const qs = require("querystring");
const cookieSession = require("cookie-session");
const csurf = require("csurf");
const { hashPassword, comparePassword } = require("./bc");
const helmet = require("helmet");

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
        ["/login", "/signup", "/", "/signers"].includes(req.url.split("?")[0])
    ) {
        next();
    } else {
        res.redirect("/signup");
    }
});
app.use(/^(\/signup|\/login)/, function (req, res, next) {
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
        loggedin: !!req.session.userId,
        signature: !!req.session.signatureId,
    });
});

function capitalize(text, separator = "-") {
    return text
        .split(separator)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}

app.get("/petition", (req, res) => {
    if (req.session.userId && req.session.signatureId) {
        return res.redirect("/signers");
    } else if (req.session.userId) {
        db.readSignature({ user_id: req.session.userId })
            .then((data) => {
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
            })
            .catch(() => res.sendStatus(500));
    } else {
        return res.redirect("/signup");
    }
});

app.post("/petition", (req, res) => {
    return db
        .createSignature({ ...req.body, user_id: req.session.userId })
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
        if (data.rowCount > 0) {
            comparePassword(req.body.password, data.rows[0].password)
                .then((check) => {
                    if (check) {
                        req.session.userId = data.rows[0].id;
                        req.session.first = data.rows[0].first;
                        req.session.last = data.rows[0].last;
                        return res.redirect("/petition");
                    } else {
                        return res.redirect("/login?err=true");
                    }
                })
                .catch(() => res.sendStatus(500));
        } else {
            return res.redirect("/login?err=true");
        }
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
    if (req.session.profileId) {
        res.redirect("/profile/edit");
    } else {
        res.render("profile");
    }
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
    db.createProfile(data)
        .then((data) => {
            req.session.profileId = data.rows[0].id;
            res.redirect("/petition");
        })
        .catch(() => res.sendStatus(500));
});

app.get("/profile/edit", (req, res) => {
    return Promise.all([
        db.readUser({ id: req.session.userId }),
        db.readProfile({ user_id: req.session.userId }),
    ])
        .then((data) => {
            if (data[1].rows.length > 0 && data[0].rows.length > 0) {
                const { first, last, email } = data[0].rows[0];
                const { age, city, url } = data[1].rows[0];
                return res.render("profile_edit", {
                    first,
                    last,
                    email,
                    age,
                    city,
                    url,
                    helpers: { capitalize },
                });
            } else {
                return res.redirect("/profile");
            }
        })
        .catch(() => res.sendStatus(500));
});

app.post("/profile/edit", (req, res) => {
    let { first, last, age, city, url, email, password } = req.body;

    if (password) {
        return hashPassword(password).then((hashedPw) => {
            return Promise.all([
                db.updateUser({
                    first,
                    last,
                    email,
                    password: hashedPw,
                    id: req.session.userId,
                }),
                db.updateProfile({
                    user_id: req.session.userId,
                    age,
                    city,
                    url,
                }),
            ])
                .then(() => res.redirect("/petition"))
                .catch(() => res.sendStatus(500));
        });
    } else {
        return Promise.all([
            db.updateUser({ first, last, email, id: req.session.userId }),
            db.updateProfile({ user_id: req.session.userId, age, city, url }),
        ])
            .then(() => res.redirect("/petition"))
            .catch(() => res.sendStatus(500));
    }
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
                    capitalize,
                },
            });
        })
        .catch(() => res.sendStatus(500));
});

app.get("/signers/:city", (req, res) => {
    let { city } = req.params;
    city = city.replace("%20", " ");
    db.readAllSignatures({ city })
        .then((result) => {
            return res.render("signers", {
                signers: result.rows,
                city: true,
                helpers: {
                    toLowerCase(str) {
                        return str.toLowerCase();
                    },
                    capitalize,
                },
            });
        })
        .catch(() => res.sendStatus(500));
});

app.listen(process.env.PORT || 8080, () => console.log("listening"));
