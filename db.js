const spicedPg = require("spiced-pg");

const { dbUser, dbPass } = require("./secrets.json");

const db = spicedPg(`postgres:${dbUser}:${dbPass}:@localhost:5432/petition`);

exports.readAllSignatures = () => {
    const query = `SELECT * FROM signature;`;
    return db.query(query);
};

exports.readSignature = ({ id }) => {
    const query = `SELECT * FROM signature WHERE id = $1;`;
    return db.query(query, [id]);
};

exports.createSignature = ({ firstName, lastName, signature }) => {
    const query = `INSERT INTO signature ("firstName", "lastName", signature) VALUES ($1, $2, $3) RETURNING *;`;
    return db.query(query, [firstName, lastName, signature]);
};

exports.updateSignature = (obj) => {
    let promises = [];
    for (let key in obj) {
        const query = `UPDATE signature SET ${key} = $1 WHERE id = $2`;
        promises.push(db.query(query, [obj[key], obj.id]));
    }

    return Promise.all(promises);
};

exports.deleteSignature = ({ id }) => {
    const query = `DELETE FROM signature WHERE id = $1`;
    return db.query(query, [id]);
};
