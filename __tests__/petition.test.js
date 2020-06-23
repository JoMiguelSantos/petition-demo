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

describe("/petition route", () => {
    it("redirects to signers if authenticated and have signed petition already", () => {
        const session = { userId: 1, signatureId: 2 };
        cookieSession.mockSessionOnce(session);
        return supertest(app)
            .get("/petition")
            .expect(302)
            .then((res) => {
                expect(res.headers.location).toContain("/signers");
            });
    });

    it("renders the petition template", () => {
        const session = { userId: 1 };
        cookieSession.mockSessionOnce(session);
        return supertest(app)
            .get("/petition")
            .expect(200)
            .then((res) => {
                expect(res.text).toContain("Sign Petition");
            });
    });

    it("redirects to thanks page after signature submit", () => {
        const session = { userId: 1 };
        cookieSession.mockSessionOnce(session);
        return supertest(app)
            .post("/petition")
            .expect(302)
            .then((res) => {
                expect(res.headers.location).toContain("/thanks");
                expect(session.signatureId).not.toBe(null || undefined);
            });
    });
});
