const { app } = require("../index");
const supertest = require("supertest");
const cookieSession = require("cookie-session");

jest.mock("../db");
const db = require("../db");

describe("/signers route", () => {
    it("renders the signers template with user data", () => {
        const session = { userId: 1 };
        cookieSession.mockSessionOnce(session);
        db.readAllSignatures.mockResolvedValue({
            rows: [
                {
                    id: 10,
                    age: 32,
                    city: "Berlin",
                    url: "http://google.com",
                    first: "Joao",
                    last: "Santos",
                },
                {
                    id: 10,
                    age: 18,
                    city: "Rome",
                    url: "http://google.it",
                    first: "Mario",
                    last: "Luigi",
                },
            ],
        });
        return supertest(app)
            .get("/signers")
            .expect(200)
            .then((res) => {
                expect(res.text).toContain("Berlin");
                expect(res.text).toContain("Joao");
                expect(res.text).toContain("Santos");
                expect(res.text).toContain("32");
                expect(res.text).toContain("http://google.com");
                expect(res.text).not.toContain("We, the people of");
                expect(res.text).not.toContain("See all signers");
            });
    });

    it("renders the signers template with ", () => {
        const session = { userId: 1 };
        cookieSession.mockSessionOnce(session);
        db.readAllSignatures.mockResolvedValue({
            rows: [
                {
                    id: 10,
                    age: 18,
                    city: "Rome",
                    url: "http://google.it",
                    first: "Mario",
                    last: "Luigi",
                },
            ],
        });
        return supertest(app)
            .get("/signers/rome")
            .expect(200)
            .then((res) => {
                expect(res.text).toContain("We, the people of Rome");
                expect(res.text).toContain("See all signers");
            });
    });
});
