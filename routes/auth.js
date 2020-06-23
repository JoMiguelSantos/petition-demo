const router = require("express").Router();
const { hashPassword, comparePassword } = require("../bc");
const qs = require("querystring");
const db = require("../db");

router.get("/login", (req, res) => {
    const err = qs.parse(req.url.split("?")[1])["err"];

    if (err === "true") {
        res.render("login", { err: "Your email or password is not correct" });
    } else {
        res.render("login", { err: "" });
    }
});

router.post("/login", (req, res) => {
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
                        return res.redirect("/auth/login?err=true");
                    }
                })
                .catch(() => res.sendStatus(500));
        } else {
            return res.redirect("/auth/login?err=true");
        }
    });
});

router.get("/logout", (req, res) => {
    req.session = null;
    res.redirect("/");
});

router.get("/signup", (req, res) => {
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

router.post("/signup", (req, res) => {
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
                return res.redirect("/auth/signup?err=true");
            });
    });
});

module.exports = router;
