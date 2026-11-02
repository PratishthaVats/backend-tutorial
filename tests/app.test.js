import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import app from "../src/app.js";
import User from "../src/models/user.model.js";
import Post from "../src/models/post.model.js";

describe("Automated Backend API & Model Integration Tests", () => {
  let server;
  let baseUrl;

  before(async () => {
    // Start Express app on an ephemeral port for testing
    await new Promise((resolve) => {
      server = http.createServer(app);
      server.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}`;
        resolve();
      });
    });
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  it("GET /api/v1/health should return 200 OK and healthy status", async () => {
    const res = await fetch(`${baseUrl}/api/v1/health`);
    const data = await res.json();

    assert.equal(res.status, 200);
    assert.equal(data.success, true);
    assert.equal(typeof data.message, "string");
    assert.ok(data.timestamp);
  });

  it("GET / should return 200 OK and welcome message", async () => {
    const res = await fetch(`${baseUrl}/`);
    const data = await res.json();

    assert.equal(res.status, 200);
    assert.equal(data.success, true);
    assert.equal(data.documentation, "/api/v1/health");
  });

  it("GET /api/v1/undefined-route should return 404 Route not found", async () => {
    const res = await fetch(`${baseUrl}/api/v1/undefined-route`);
    const data = await res.json();

    assert.equal(res.status, 404);
    assert.equal(data.success, false);
    assert.ok(data.message.includes("Route not found"));
  });

  it("POST /api/v1/users/register should reject empty payload with 400", async () => {
    const res = await fetch(`${baseUrl}/api/v1/users/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const data = await res.json();

    assert.equal(res.status, 400);
    assert.equal(data.success, false);
    assert.equal(
      data.message,
      "Please provide username, email, and password"
    );
  });

  it("POST /api/v1/users/register should reject short password with 400", async () => {
    const res = await fetch(`${baseUrl}/api/v1/users/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "testuser",
        email: "test@example.com",
        password: "123",
      }),
    });
    const data = await res.json();

    assert.equal(res.status, 400);
    assert.equal(data.success, false);
    assert.equal(data.message, "Password must be at least 6 characters long");
  });

  it("POST /api/v1/users/login should reject empty payload with 400", async () => {
    const res = await fetch(`${baseUrl}/api/v1/users/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const data = await res.json();

    assert.equal(res.status, 400);
    assert.equal(data.success, false);
    assert.equal(data.message, "Please provide email and password");
  });

  it("POST /api/v1/posts/create should reject missing required fields with 400", async () => {
    const res = await fetch(`${baseUrl}/api/v1/posts/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Incomplete" }),
    });
    const data = await res.json();

    assert.equal(res.status, 400);
    assert.equal(data.success, false);
    assert.equal(data.message, "Please provide name, description, and age");
  });

  it("POST /api/v1/posts/create should reject negative or invalid age with 400", async () => {
    const res = await fetch(`${baseUrl}/api/v1/posts/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Post",
        description: "Valid description",
        age: -5,
      }),
    });
    const data = await res.json();

    assert.equal(res.status, 400);
    assert.equal(data.success, false);
    assert.equal(data.message, "Age must be a valid non-negative number");
  });

  it("GET /api/v1/posts/:id should return 400 for invalid ObjectId format", async () => {
    const res = await fetch(`${baseUrl}/api/v1/posts/invalid-mongo-id-123`);
    const data = await res.json();

    assert.equal(res.status, 400);
    assert.equal(data.success, false);
    assert.equal(data.message, "Invalid post ID format");
  });

  it("PUT /api/v1/posts/:id should return 400 for invalid ObjectId format", async () => {
    const res = await fetch(`${baseUrl}/api/v1/posts/invalid-mongo-id-123`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Updated Name" }),
    });
    const data = await res.json();

    assert.equal(res.status, 400);
    assert.equal(data.success, false);
    assert.equal(data.message, "Invalid post ID format");
  });

  it("DELETE /api/v1/posts/:id should return 400 for invalid ObjectId format", async () => {
    const res = await fetch(`${baseUrl}/api/v1/posts/invalid-mongo-id-123`, {
      method: "DELETE",
    });
    const data = await res.json();

    assert.equal(res.status, 400);
    assert.equal(data.success, false);
    assert.equal(data.message, "Invalid post ID format");
  });

  it("User Model schema should enforce validation rules and bcrypt password hashing", async () => {
    const userDoc = new User({
      username: "  alice_bob  ",
      email: "  ALICE@EXAMPLE.COM  ",
      password: "secretPassword123",
    });

    // Validate trim and lowercase on initialization
    assert.equal(userDoc.username, "alice_bob");
    assert.equal(userDoc.email, "alice@example.com");

    // Test password hashing pre-save hook
    await userDoc.validate();
    assert.ok(userDoc.password);

    // Execute save hook
    await userDoc.schema.s.hooks.execPre("save", userDoc);

    assert.notEqual(userDoc.password, "secretPassword123");
    const isCorrect = await userDoc.comparePassword("secretPassword123");
    const isWrong = await userDoc.comparePassword("wrongPassword");
    assert.equal(isCorrect, true);
    assert.equal(isWrong, false);
  });

  it("Post Model schema should validate required fields and constraints", async () => {
    const validPost = new Post({
      name: "  Introduction to Node.js  ",
      description: "  A comprehensive guide  ",
      age: 24,
    });

    await validPost.validate();
    assert.equal(validPost.name, "Introduction to Node.js");
    assert.equal(validPost.description, "A comprehensive guide");
    assert.equal(validPost.age, 24);

    const invalidPost = new Post({
      name: "",
      description: "",
      age: -1,
    });
    let validationError;
    try {
      await invalidPost.validate();
    } catch (err) {
      validationError = err;
    }
    assert.ok(validationError);
    assert.ok(validationError.errors.name);
    assert.ok(validationError.errors.description);
    assert.ok(validationError.errors.age);
  });
});
