const router = require("express").Router();
const db = require("../db");
const { capitalize } = require("../utils");

router.get("/", (req, res) => {
    return db
        .readAllSignatures({})
        .then((result) => {
            const signers = result.rows.map((signer) => {
                for (let key in signer) {
                    if (!signer[key]) {
                        signer[key] = "";
                    }
                }
                return signer;
            });
            return res.render("signers", {
                signers,
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

router.get("/:city", (req, res) => {
    let { city } = req.params;
    city = city.replace("%20", " ");
    db.readAllSignatures({ city })
        .then((result) => {
            const signers = result.rows.map((signer) => {
                for (let key in signer) {
                    if (!signer[key]) {
                        signer[key] = "";
                    }
                }
                return signer;
            });
            return res.render("signers", {
                signers,
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

module.exports = router;
