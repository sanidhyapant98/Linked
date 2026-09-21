import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../app.js";
import { resetDb, createTestLink } from "../testHelpers.js";

describe("POST /api/links", () => {
  beforeEach(resetDb);

  it("creates a link", async () => {
    const res = await request(app)
      .post("/api/links")
      .send({ originalUrl: "https://example.com" });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ originalUrl: "https://example.com" });
    expect(res.body.shortCode).toHaveLength(6);
  });

  it("rejects a missing originalUrl with 422", async () => {
    const res = await request(app).post("/api/links").send({});

    expect(res.status).toBe(422);
    expect(res.body.error.message).toBe("Validation failed");
  });

  it("rejects an invalid URL with 422", async () => {
    const res = await request(app).post("/api/links").send({ originalUrl: "not-a-url" });

    expect(res.status).toBe(422);
  });
});

describe("GET /api/links", () => {
  beforeEach(resetDb);

  it("returns a paginated envelope", async () => {
    await createTestLink("https://a.com");
    await createTestLink("https://b.com");

    const res = await request(app).get("/api/links?page=1&limit=1");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.meta).toMatchObject({
      page: 1,
      limit: 1,
      totalItems: 2,
      totalPages: 2,
      hasNextPage: true,
      hasPreviousPage: false
    });
  });

  it("filters by search", async () => {
    await createTestLink("https://findme.com");
    await createTestLink("https://other.com");

    const res = await request(app).get("/api/links?search=findme");

    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].originalUrl).toBe("https://findme.com");
  });

  it("rejects a limit over 100 with 422", async () => {
    const res = await request(app).get("/api/links?limit=500");

    expect(res.status).toBe(422);
  });
});

describe("GET /api/links/:id", () => {
  beforeEach(resetDb);

  it("returns 404 for a non-existent id", async () => {
    const res = await request(app).get("/api/links/999999");

    expect(res.status).toBe(404);
  });

  it("returns 422 for a non-numeric id", async () => {
    const res = await request(app).get("/api/links/not-a-number");

    expect(res.status).toBe(422);
  });

  it("returns the link when it exists", async () => {
    const link = await createTestLink();

    const res = await request(app).get(`/api/links/${link.id}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(link.id);
  });
});

describe("PUT /api/links/:id", () => {
  beforeEach(resetDb);

  it("updates originalUrl", async () => {
    const link = await createTestLink("https://old.com");

    const res = await request(app)
      .put(`/api/links/${link.id}`)
      .send({ originalUrl: "https://new.com" });

    expect(res.status).toBe(200);
    expect(res.body.originalUrl).toBe("https://new.com");
  });

  it("returns 404 when updating a non-existent link", async () => {
    const res = await request(app)
      .put("/api/links/999999")
      .send({ originalUrl: "https://new.com" });

    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/links/:id", () => {
  beforeEach(resetDb);

  it("deletes an existing link", async () => {
    const link = await createTestLink();

    const res = await request(app).delete(`/api/links/${link.id}`);
    expect(res.status).toBe(204);

    const followUp = await request(app).get(`/api/links/${link.id}`);
    expect(followUp.status).toBe(404);
  });

  it("returns 404 when deleting a non-existent link", async () => {
    const res = await request(app).delete("/api/links/999999");

    expect(res.status).toBe(404);
  });
});
