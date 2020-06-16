const express = require("express");
const handlebars = require("express-handlebars");
const db = require("./db");
const app = express();

app.use(express.static("public"));
app.engine("handlebars", handlebars());
app.set("view engine", "handlebars");

app.post("/petition", (req, res) => {
    const { petition } = req.body;
    res.render("petition", {
        petition,
    });
});

app.get("/thanks", (req, res) => {
    return res.render("thanks");
});

app.get("/signers", (req, res) => {
    const signers = db
        .readAllSignatures()
        .then((result) => result)
        .catch((err) => res.redirect("/petition?err=true"));
    return res.render("signers", { signers });
});

app.listen(8080, () => console.log("listening"));
