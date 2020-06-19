const spicedPg = require("spiced-pg");

const { dbUser, dbPass } = require("./secrets.json");

const db = spicedPg(`postgres:${dbUser}:${dbPass}:@localhost:5432/petition`);

exports.readAllSignatures = ({ user_id, city }) => {
    let query;
    if (user_id) {
        query = `SELECT * 
                 FROM signatures 
                 JOIN users ON signatures.user_id = ANY($1);`;
    } else if (city) {
        query = `SELECT * 
                 FROM signatures 
                 JOIN users ON signatures.user_id = users.id 
                 LEFT JOIN user_profiles ON signatures.user_id = user_profiles.user_id 
                 WHERE city = $1;`;
    } else {
        query = `SELECT * 
                 FROM signatures 
                 JOIN users ON signatures.user_id = users.id 
                 LEFT JOIN user_profiles ON signatures.user_id = user_profiles.user_id;`;
        return db.query(query);
    }
    return db.query(query, [user_id || city]);
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

exports.readProfile = ({ user_id }) => {
    const query = `SELECT * FROM user_profiles WHERE user_id = $1`;
    return db.query(query, [user_id]);
};

exports.createProfile = ({ user_id, age, city, url }) => {
    const query = `INSERT INTO user_profiles (user_id, age, city, url) VALUES ($1, $2, $3, $4) RETURNING *;`;
    return db.query(query, [user_id, age, city, url]);
};

exports.updateProfile = (userProfile) => {
    let promises = [];
    for (let key in userProfile) {
        const query = `UPDATE user_profiles SET ${key} = $1 WHERE id = $2`;
        promises.push(db.query(query, [userProfile[key], userProfile.id]));
    }
    return Promise.all(promises);
};

exports.deleteProfile = ({ id }) => {
    const query = `DELETE FROM user_profiles WHERE id = $1`;
    return db.query(query, [id]);
};
