const express = require("express");
const handlebars = require("express-handlebars");
const db = require("./db");
const app = express();
const qs = require("querystring");
const cookieSession = require("cookie-session");
const csurf = require("csurf");

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

app.get("/petition", (req, res) => {
    if (req.session.signatureId) {
        return res.redirect("/signers");
    }

    const err = qs.parse(req.url.split("?")[1])["err"];

    if (err === "true") {
        return res.render("petition", {
            err:
                "Oh nooo, something went wrong, please resubmitted your signature :(",
            layout: "signature",
        });
    } else {
        return res.render("petition", {
            err: "",
            layout: "signature",
        });
    }
});

app.post("/petition", (req, res) => {
    db.createSignature(req.body)
        .then((data) => {
            req.session.signatureId = data.rows[0].id;
            return res.redirect("/thanks");
        })
        .catch(() => {
            return res.redirect("/petition?err=true");
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
