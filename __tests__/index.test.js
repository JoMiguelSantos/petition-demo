const { app } = require("../index");
const supertest = require("supertest");
const cookieSession = require("cookie-session");

jest.mock("../db");
const db = require("../db");

db.deleteSignature.mockResolvedValue({
    rows: [
        {
            id: 10,
        },
    ],
});

db.readSignature.mockResolvedValue({
    rows: [
        {
            id: 10,
            signature: "data:enevozfbvseouvbj",
        },
    ],
});

describe("/signature route", () => {
    test("deletes signature", () => {
        const session = { userId: 1, signatureId: 2 };
        cookieSession.mockSessionOnce(session);
        return supertest(app)
            .post("/signature")
            .expect(302)
            .then((res) => {
                expect(res.headers.location).toContain("/petition");
                expect(session.signatureId).toBe(null);
            });
    });
});

describe("/ homepage route", () => {
    it("renders if you have no session", () => {
        return supertest(app)
            .get("/")
            .expect(200)
            .then((res) => {
                expect(res.text).toContain("LOG IN");
                expect(res.text).toContain("SIGN UP");
                expect(res.text).not.toContain("SIGNATURE");
                expect(res.text).not.toContain("LOG OUT");
            });
    });

    it("renders correct html if you are logged in", () => {
        const session = { userId: 1 };
        cookieSession.mockSessionOnce(session);
        return supertest(app)
            .get("/")
            .expect(200)
            .then((res) => {
                expect(res.text).toContain("LOG OUT");
            });
    });

    it("renders correct html if you have signed the petition", () => {
        const session = { userId: 1, signatureId: 2 };
        cookieSession.mockSessionOnce(session);
        return supertest(app)
            .get("/")
            .expect(200)
            .then((res) => {
                expect(res.text).toContain("SIGNATURE");
            });
    });
});

// test /thanks
describe("/thanks route", () => {
    it("renders thanks page", () => {
        const session = { userId: 1, signatureId: 2 };
        cookieSession.mockSessionOnce(session);
        return supertest(app)
            .get("/thanks")
            .expect(200)
            .then((res) => {
                expect(res.text).toContain("Update your Profile");
                expect(res.text).toContain("Thank you for your signature!");
            });
    });

    it("redirects to petition in case user hasn't signed the petition yet", () => {
        const session = { userId: 1 };
        cookieSession.mockSessionOnce(session);
        return supertest(app)
            .get("/thanks")
            .expect(302)
            .then((res) => {
                expect(res.headers.location).toContain("/petition");
                expect(session.signatureId).toBe(null || undefined);
            });
    });
});

describe("user cannot access restricted resources without session cookie userId", () => {
    it("cannot access petition page", () => {
        const session = {};
        cookieSession.mockSessionOnce(session);
        return supertest(app)
            .get("/petition")
            .expect(302)
            .then((res) => {
                expect(res.headers.location).toContain("/");
            });
    });

    it("cannot access thanks page", () => {
        const session = {};
        cookieSession.mockSessionOnce(session);
        return supertest(app)
            .get("/thanks")
            .expect(302)
            .then((res) => {
                expect(res.headers.location).toContain("/");
            });
    });

    it("cannot access profile page", () => {
        const session = {};
        cookieSession.mockSessionOnce(session);
        return supertest(app)
            .get("/profile")
            .expect(302)
            .then((res) => {
                expect(res.headers.location).toContain("/");
            });
    });
});
