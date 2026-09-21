import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../../app.js";
import { env } from "../../config/env.js";

describe("test env", () => {
  it("resolves NODE_ENV to test under vitest", () => {
    expect(env.NODE_ENV).toBe("test");
  });
});

describe("security headers", () => {
  it("does not leak X-Powered-By", async () => {
    const res = await request(app).get("/health");
    expect(res.headers["x-powered-by"]).toBeUndefined();
  });

  it("sets a request ID on every response", async () => {
    const res = await request(app).get("/health");
    expect(res.headers["x-request-id"]).toBeTruthy();
  });

  it("echoes a caller-supplied request ID", async () => {
    const res = await request(app)
      .get("/health")
      .set("x-request-id", "fixed-id-abc");
    expect(res.headers["x-request-id"]).toBe("fixed-id-abc");
  });
});
