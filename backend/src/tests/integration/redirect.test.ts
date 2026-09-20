import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../app.js";
import { resetDb, createTestLink } from "../testHelpers.js";

describe("GET /:shortCode (redirect)", () => {
  beforeEach(resetDb);

  it("redirects to the original URL", async () => {
    const link = await createTestLink("https://destination.com");

    const res = await request(app).get(`/${link.shortCode}`);

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("https://destination.com");
  });

  it("returns 404 for an unknown short code", async () => {
    const res = await request(app).get("/doesnotexist");

    expect(res.status).toBe(404);
  });

  it("records a click and increments clickCount", async () => {
    const link = await createTestLink();

    await request(app).get(`/${link.shortCode}`);
    await request(app).get(`/${link.shortCode}`);

    const res = await request(app).get(`/api/links/${link.id}`);

    expect(res.body.clickCount).toBe(2);
  });
});

describe("GET /api/links/:id/analytics", () => {
  beforeEach(resetDb);

  it("reflects recorded clicks", async () => {
    const link = await createTestLink();

    await request(app).get(`/${link.shortCode}`).set("Referer", "https://google.com");

    const res = await request(app).get(`/api/links/${link.id}/analytics`);

    expect(res.status).toBe(200);
    expect(res.body.totalClicks).toBe(1);
    expect(res.body.recentClicks[0].referrer).toBe("https://google.com");
  });

  it("returns 404 for a non-existent link", async () => {
    const res = await request(app).get("/api/links/999999/analytics");

    expect(res.status).toBe(404);
  });
});

describe("GET /api/links/:id/clicks", () => {
  beforeEach(resetDb);

  it("paginates click history", async () => {
    const link = await createTestLink();

    await request(app).get(`/${link.shortCode}`);
    await request(app).get(`/${link.shortCode}`);
    await request(app).get(`/${link.shortCode}`);

    const res = await request(app).get(`/api/links/${link.id}/clicks?page=1&limit=2`);

    expect(res.body.data).toHaveLength(2);
    expect(res.body.meta.totalItems).toBe(3);
    expect(res.body.meta.hasNextPage).toBe(true);
  });
});
