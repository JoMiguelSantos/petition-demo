const { app } = require("../index");
const supertest = require("supertest");
const cookieSession = require("cookie-session");

jest.mock("../db");
const db = require("../db");

db.readProfile.mockResolvedValue({
    rows: [],
});

db.createProfile.mockResolvedValue({
    rows: [
        {
            id: 10,
        },
    ],
});

describe("/profile route", () => {
    it("redirects to /profile/edit if authenticated and have profile already", () => {
        const session = { userId: 1, profileId: 2 };
        cookieSession.mockSessionOnce(session);
        return supertest(app)
            .get("/profile")
            .expect(302)
            .then((res) => {
                expect(res.headers.location).toContain("/profile/edit");
            });
    });

    it("renders the profile template if the user has not profile yet", () => {
        const session = { userId: 1 };
        cookieSession.mockSessionOnce(session);
        return supertest(app)
            .get("/profile")
            .expect(200)
            .then((res) => {
                expect(res.text).toContain(
                    "Please tell us more about yourself"
                );
            });
    });

    it("redirects to petition page after profile submit if no data was input", () => {
        const session = { userId: 1 };
        cookieSession.mockSessionOnce(session);
        return supertest(app)
            .post("/profile")
            .expect(302)
            .then((res) => {
                expect(res.headers.location).toContain("/petition");
            });
    });

    it("redirects to petition page after profile submit if all data was input", () => {
        const session = { userId: 1 };
        cookieSession.mockSessionOnce(session);
        return supertest(app)
            .post("/profile")
            .send("user_id=10&age=32&city=Berlin&url=http://google.com")
            .expect(302)
            .then((res) => {
                expect(session.profileId).not.toBe(null || undefined);
                expect(res.headers.location).toContain("/petition");
            });
    });

    it("redirects to petition page after profile submit if no data was input", () => {
        const session = { userId: 1, profileId: 2 };
        cookieSession.mockSessionOnce(session);
        db.readProfile.mockResolvedValue({
            rows: [
                {
                    id: 10,
                    age: 32,
                    city: "Berlin",
                    url: "http://google.com",
                },
            ],
        });
        db.readUser.mockResolvedValue({
            rows: [
                {
                    id: 10,
                    first: "Joao",
                    last: "Santos",
                    email: "jj@gmail.com",
                },
            ],
        });
        return supertest(app)
            .get("/profile/edit")
            .expect(200)
            .then((res) => {
                expect(res.headers.location).toContain("/profile");
            });
    });
});
