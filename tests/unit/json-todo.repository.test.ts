
import { afterEach, describe, expect, it } from "vitest";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

import { JsonTodoRepository } from "../../src/repositories/json-todo.repository";

let testDirectory: string | undefined;

async function createRepository() {
  testDirectory = await fs.mkdtemp(
    path.join(os.tmpdir(), "todo-test-")
  );

  const filePath = path.join(testDirectory, "todos.json");

  return {
    repository: new JsonTodoRepository(filePath),
    filePath,
  };
}

afterEach(async () => {
  if (testDirectory) {
    await fs.rm(testDirectory, {
      recursive: true,
      force: true,
    });

    testDirectory = undefined;
  }
});

describe("JsonTodoRepository", () => {
  it("initializes an empty storage file", async () => {
    const { repository, filePath } = await createRepository();

    expect(await repository.findAll()).toEqual([]);
    expect(await fs.readFile(filePath, "utf8")).toBe("[]");
  });

  it("creates a task with a generated ID", async () => {
    const { repository } = await createRepository();

    const todo = await repository.create({
      title: "Write tests",
      isCompleted: false,
      createdAt: "2026-10-14T12:00:00.000Z",
    });

    expect(todo.id).toBeTruthy();
    expect(todo.title).toBe("Write tests");
    expect(await repository.findById(todo.id)).toEqual(todo);
  });

  it("persists tasks when a new repository instance loads the file", async () => {
    const { repository, filePath } = await createRepository();

    const created = await repository.create({
      title: "Persist this task",
      isCompleted: false,
      createdAt: "2026-10-14T12:00:00.000Z",
    });

    const reloadedRepository = new JsonTodoRepository(filePath);

    expect(
      await reloadedRepository.findById(created.id)
    ).toEqual(created);
  });

  it("updates an existing task", async () => {
    const { repository } = await createRepository();

    const created = await repository.create({
      title: "Original title",
      isCompleted: false,
      createdAt: "2026-10-14T12:00:00.000Z",
    });

    const updated = await repository.update(created.id, {
      ...created,
      title: "Updated title",
    });

    expect(updated?.title).toBe("Updated title");
    expect(await repository.findById(created.id)).toEqual(updated);
  });

  it("returns undefined when updating a missing task", async () => {
    const { repository } = await createRepository();

    expect(
      await repository.update("missing-id", {
        id: "missing-id",
        title: "Unknown",
        isCompleted: false,
        createdAt: "2026-10-14T12:00:00.000Z",
      })
    ).toBeUndefined();
  });

  it("deletes an existing task", async () => {
    const { repository } = await createRepository();

    const created = await repository.create({
      title: "Delete me",
      isCompleted: false,
      createdAt: "2026-10-14T12:00:00.000Z",
    });

    expect(await repository.delete(created.id)).toBe(true);
    expect(await repository.findById(created.id)).toBeUndefined();
    expect(await repository.delete(created.id)).toBe(false);
  });
});
