const express = require("express");
const handlebars = require("express-handlebars");
const db = require("./db");
const app = express();
const qs = require("querystring");

app.use(express.static("public"));
app.use(require("cookie-parser")());
app.use(
    express.urlencoded({
        extended: false,
    })
);

app.engine("handlebars", handlebars());
app.set("view engine", "handlebars");

app.get("/petition", (req, res) => {
    if (req.cookies["signed"] === "true") {
        return res.redirect("/signers");
    }

    const err = qs.parse(req.url)["err"];
    if (err === "true") {
        return res.render("petition", {
            err:
                "Oh nooo, something went wrong, please resubmitted your signature :(",
            layout: "signature",
        });
    } else {
        return res.render("petition", { err: "", layout: "signature" });
    }
});

app.post("/petition", (req, res) => {
    db.createSignature(req.body)
        .then(() => {
            res.cookie("signed", "true");
            return res.redirect("/thanks");
        })
        .catch((err) => {
            return res.redirect("/petition?err=true");
        });
});

app.get("/thanks", (req, res) => {
    return res.render("thanks");
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
