const router = require("express").Router();
const db = require("../db");
const { capitalize } = require("../utils");
const { hashPassword } = require("../bc");

router.get("/", (req, res) => {
    if (req.session.profileId) {
        return res.redirect("/profile/edit");
    } else {
        return db.readProfile({ user_id: req.session.userId }).then((data) => {
            if (!!data.rowCount) {
                return res.redirect("/profile/edit");
            } else {
                return res.render("profile", {
                    loggedin: !!req.session.userId,
                    signed: !!req.session.signatureId,
                });
            }
        });
    }
});

router.post("/", (req, res) => {
    let { age, city, url } = req.body;

    if (!(age || city || url)) {
        return res.redirect("/petition");
    }

    city = city.toLowerCase();
    const user_id = req.session.userId;
    let data;
    if (/^https?:\/\//.test(url)) {
        data = { user_id, age, city, url };
    } else {
        data = { user_id, age, city };
    }
    return db
        .createProfile(data)
        .then((data) => {
            req.session.profileId = data.rows[0].id;
            res.redirect("/petition");
        })
        .catch(() => {
            return res.sendStatus(500);
        });
});

router.get("/edit", (req, res) => {
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
                    loggedin: !!req.session.userId,
                    signed: !!req.session.signatureId,
                    helpers: { capitalize },
                });
            } else {
                return res.redirect("/profile");
            }
        })
        .catch(() => res.sendStatus(500));
});

router.post("/edit", (req, res) => {
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

module.exports = router;
