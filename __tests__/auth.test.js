const { app } = require("../index");
const supertest = require("supertest");
const cookieSession = require("cookie-session");
const db = require("../db");

describe("auth route", () => {
    beforeAll(() => {
        return db.deleteAll().then(() => console.log("DB reset"));
    });

    afterAll(() => {
        return db.deleteAll().then(() => console.log("DB reset"));
    });

    it("is able to render the signup page", () => {
        const session = {};
        cookieSession.mockSessionOnce(session);
        return supertest(app)
            .get("/auth/signup")
            .expect(200)
            .then((res) => {
                expect(session.userId).toBe(null || undefined);
                expect(res.text).toContain("SIGN UP");
            });
    });

    it("is able to signup a user", () => {
        const session = {};
        cookieSession.mockSessionOnce(session);
        return supertest(app)
            .post("/auth/signup")
            .send("first=Test&last=Test&email=test@email.com&password=test1234")
            .expect(302)
            .then((res) => {
                expect(res.headers.location).toContain("/profile");
                expect(session.userId).not.toBe(null || undefined);
            });
    });

    it("is able to render the login page", () => {
        const session = {};
        cookieSession.mockSessionOnce(session);
        return supertest(app)
            .get("/auth/login")
            .expect(200)
            .then((res) => {
                expect(session.userId).toBe(null || undefined);
                expect(res.text).toContain("LOG IN");
            });
    });

    it("is able to login a user", () => {
        const session = {};
        cookieSession.mockSessionOnce(session);
        return supertest(app)
            .post("/auth/login")
            .send("email=test@email.com&password=test1234")
            .expect(302)
            .then((res) => {
                expect(res.headers.location).toContain("/petition");
                expect(session.userId).not.toBe(null || undefined);
            });
    });
});
