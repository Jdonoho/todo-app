
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

import { createApp } from "../../src/app";
import type { Todo } from "../../src/models/todo";

describe("Todo routes", () => {
  let tempDirectory: string;
  let dataFilePath: string;
  let app: ReturnType<typeof createApp>;

  beforeEach(async () => {
    tempDirectory = await fs.mkdtemp(
      path.join(os.tmpdir(), "todo-app-test-")
    );

    dataFilePath = path.join(tempDirectory, "todos.json");
    app = createApp(dataFilePath);
  });

  afterEach(async () => {
    await fs.rm(tempDirectory, { recursive: true, force: true });
  });

  it("creates and displays a task", async () => {
    const response = await request(app)
      .post("/todos")
      .type("form")
      .send({
        title: "Prepare for interview",
        description: "Review TypeScript and Express",
        dueDate: "2026-11-01",
      });

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe("/todos");

    const listResponse = await request(app).get("/todos");

    expect(listResponse.status).toBe(200);
    expect(listResponse.text).toContain("Prepare for interview");
    expect(listResponse.text).toContain("Review TypeScript and Express");
  });

  it("rejects a task with a blank title", async () => {
    const response = await request(app)
      .post("/todos")
      .type("form")
      .send({ title: "   " });

    expect(response.status).toBe(400);
    expect(response.text).toContain("Title is required.");
  });

  it("supports viewing, editing, completing, and deleting a task", async () => {
    await request(app)
      .post("/todos")
      .type("form")
      .send({
        title: "Original title",
        description: "Original description",
        dueDate: "",
      })
      .expect(302);

    const storedContents = await fs.readFile(dataFilePath, "utf8");
    const todos = JSON.parse(storedContents) as Todo[];
    const todo = todos[0];

    expect(todo).toBeDefined();

    const detailResponse = await request(app).get(`/todos/${todo.id}`);

    expect(detailResponse.status).toBe(200);
    expect(detailResponse.text).toContain("Original title");

    await request(app)
      .post(`/todos/${todo.id}/edit`)
      .type("form")
      .send({
        title: "Updated title",
        description: "Updated description",
        dueDate: "2026-11-15",
      })
      .expect(302);

    const editedContents = await fs.readFile(dataFilePath, "utf8");
    const editedTodos = JSON.parse(editedContents) as Todo[];

    expect(editedTodos[0].title).toBe("Updated title");
    expect(editedTodos[0].description).toBe("Updated description");
    expect(editedTodos[0].dueDate).toBe("2026-11-15");

    const originalCreatedAt = todo.createdAt;

    await request(app)
      .post(`/todos/${todo.id}/completion`)
      .expect(302);

    const completedContents = await fs.readFile(dataFilePath, "utf8");
    const completedTodos = JSON.parse(completedContents) as Todo[];

    expect(completedTodos[0].isCompleted).toBe(true);
    expect(completedTodos[0].createdAt).toBe(originalCreatedAt);

    const completedResponse = await request(app).get(`/todos/${todo.id}`);

    expect(completedResponse.status).toBe(200);
    expect(completedResponse.text).toContain("Completed");

    await request(app)
      .post(`/todos/${todo.id}/delete`)
      .expect(302);

    const deletedResponse = await request(app).get(`/todos/${todo.id}`);

    expect(deletedResponse.status).toBe(404);

    const listResponse = await request(app).get("/todos");

    expect(listResponse.text).not.toContain("Updated title");
  });

  it("returns 404 for a task that does not exist", async () => {
    const response = await request(app).get("/todos/not-a-real-id");

    expect(response.status).toBe(404);
    expect(response.text).toContain("Todo not found");
  });
});
