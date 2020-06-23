const { app } = require("../index");
const supertest = require("supertest");
const cookieSession = require("cookie-session");

jest.mock("../db");
const db = require("../db");

db.readSignature.mockResolvedValue({
    rows: [],
});

db.createSignature.mockResolvedValue({
    rows: [
        {
            id: 10,
            signature: "data:enevozfbvseouvbj",
        },
    ],
});
