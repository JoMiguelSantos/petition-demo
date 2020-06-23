const router = require("express").Router();
const db = require("../db");
const qs = require("querystring");

router.get("/", (req, res) => {
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

router.post("/", (req, res) => {
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

module.exports = router;
