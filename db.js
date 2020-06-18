const spicedPg = require("spiced-pg");

const { dbUser, dbPass } = require("./secrets.json");

const db = spicedPg(`postgres:${dbUser}:${dbPass}:@localhost:5432/petition`);

exports.readAllSignatures = (filter) => {
    let query;
    if (filter) {
        query = `SELECT * FROM signatures JOIN users ON signatures.user_id = ANY(${filter});`;
    } else {
        query = `SELECT * FROM signatures JOIN users ON signatures.user_id = users.id;`;
    }
    return db.query(query);
};

exports.readSignature = ({ id, user_id }) => {
    const query = `SELECT * FROM signatures WHERE ${id || user_id} = $1;`;
    return db.query(query, [id || user_id]);
};

exports.createSignature = ({ user_id, signature }) => {
    const query = `INSERT INTO signatures (user_id, signature) VALUES ($1, $2) RETURNING *;`;
    return db.query(query, [user_id, signature]);
};

exports.updateSignature = (obj) => {
    let promises = [];
    for (let key in obj) {
        const query = `UPDATE signatures SET ${key} = $1 WHERE id = $2;`;
        promises.push(db.query(query, [obj[key], obj.id]));
    }

    return Promise.all(promises);
};

exports.deleteSignature = ({ user_id }) => {
    const query = `DELETE FROM signatures WHERE user_id = $1;`;
    return db.query(query, [user_id]);
};

exports.createUser = ({ first, last, email, password }) => {
    const query = `INSERT INTO users ("first", "last", email, password) VALUES ($1, $2, $3, $4) RETURNING *;`;
    return db.query(query, [first, last, email, password]);
};

exports.readUser = ({ email }) => {
    const query = `SELECT * FROM users WHERE email = $1`;
    return db.query(query, [email]);
};

exports.updateUser = (user) => {
    let promises = [];
    for (let key in user) {
        const query = `UPDATE users SET ${key} = $1 WHERE id = $2`;
        promises.push(db.query(query, [user[key], user.id]));
    }
    return Promise.all(promises);
};

exports.deleteUser = ({ id }) => {
    const query = `DELETE FROM users WHERE id = $1`;
    return db.query(query, [id]);
};
