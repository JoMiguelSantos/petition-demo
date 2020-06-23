const spicedPg = require("spiced-pg");

let db;
if (process.env.DATABASE_URL) {
    db = spicedPg(process.env.DATABASE_URL);
} else {
    const { dbUser, dbPass } = require("./secrets.json");
    db = spicedPg(`postgres:${dbUser}:${dbPass}:@localhost:5432/petition`);
}

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
                 WHERE city ILIKE $1;`;
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
    const query = `SELECT * FROM signatures WHERE ${
        id ? "id" : "user_id"
    } = $1;`;
    return db.query(query, [id || user_id]);
};

exports.createSignature = ({ user_id, signature }) => {
    const query = `INSERT INTO signatures (user_id, signature) VALUES ($1, $2) RETURNING *;`;
    return db.query(query, [user_id, signature]);
};

exports.deleteSignature = ({ user_id }) => {
    const query = `DELETE FROM signatures WHERE user_id = $1;`;
    return db.query(query, [user_id]);
};

exports.createUser = ({ first, last, email, password }) => {
    const query = `INSERT INTO users ("first", "last", email, password) 
                   VALUES ($1, $2, $3, $4) RETURNING *;`;
    return db.query(query, [first, last, email, password]);
};

exports.readUser = ({ email, id }) => {
    const query = `SELECT * FROM users WHERE ${id ? "id" : "email"} = $1;`;
    return db.query(query, [email || id]);
};

exports.updateUser = ({ first, last, email, password, id }) => {
    const query = `INSERT INTO users (first, last, email, password, id) 
                       VALUES ($1, $2, $3, $4, $5)
                       ON CONFLICT (id)
                       DO UPDATE SET first = $1, 
                                     last = $2, 
                                     email = $3
                                     ${password ? ",password = $4" : ""};`;
    return db.query(query, [first, last, email, password || "", id]);
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
    return db.query(query, [user_id, age || null, city || "", url || ""]);
};

exports.updateProfile = ({ user_id, age, city, url }) => {
    const query = `INSERT INTO user_profiles (age, city, url, user_id) 
                       VALUES ($1, $2, $3, $4)
                       ON CONFLICT (user_id)
                       DO UPDATE SET age = $1, 
                                     city = $2, 
                                     url = $3;`;
    return db.query(query, [age || null, city || "", url || "", user_id]);
};

exports.deleteProfile = ({ id }) => {
    const query = `DELETE FROM user_profiles WHERE id = $1`;
    return db.query(query, [id]);
};
