
import { beforeEach, describe, expect, it } from "vitest";

import type { Todo } from "../../src/models/todo";
import type { TodoRepository } from "../../src/repositories/todo.repository";
import { TodoService } from "../../src/services/todo.service";

describe("TodoService", () => {
  let repository: TodoRepository;
  let service: TodoService;
  let todos: Todo[];

  beforeEach(() => {
    todos = [];

    repository = {
      findAll: async () => [...todos],

      findById: async (id) =>
        todos.find((todo) => todo.id === id),

      create: async (input) => {
        const todo: Todo = {
          ...input,
          id: "test-id",
        };

        todos.push(todo);
        return todo;
      },

      update: async (id, updatedTodo) => {
        const index = todos.findIndex(
          (todo) => todo.id === id
        );

        if (index === -1) {
          return undefined;
        }

        todos[index] = updatedTodo;
        return updatedTodo;
      },

      delete: async (id) => {
        const remaining = todos.filter(
          (todo) => todo.id !== id
        );

        if (remaining.length === todos.length) {
          return false;
        }

        todos = remaining;
        return true;
      },
    };

    service = new TodoService(repository);
  });

  it("creates a task as incomplete with a timestamp", async () => {
    const todo = await service.createTodo({
      title: "Write tests",
    });

    expect(todo.title).toBe("Write tests");
    expect(todo.isCompleted).toBe(false);
    expect(todo.createdAt).toBeTruthy();
    expect(todo.id).toBe("test-id");
  });

  it("preserves completion status and creation date when editing", async () => {
    const created = await service.createTodo({
      title: "Original title",
    });

    await service.setCompletion(created.id, true);

    const updated = await service.updateTodo(created.id, {
      title: "Updated title",
    });

    expect(updated?.title).toBe("Updated title");
    expect(updated?.isCompleted).toBe(true);
    expect(updated?.createdAt).toBe(created.createdAt);
  });

  it("returns undefined when completing a missing task", async () => {
    expect(
      await service.setCompletion("missing-id", true)
    ).toBeUndefined();
  });

  it("returns false when deleting a missing task", async () => {
    expect(await service.deleteTodo("missing-id")).toBe(false);
  });

  it("lists created tasks", async () => {
    await service.createTodo({ title: "First task" });
    await service.createTodo({ title: "Second task" });

    const result = await service.listTodos();

    expect(result).toHaveLength(2);
    expect(result.map((todo) => todo.title)).toEqual([
      "First task",
      "Second task",
    ]);
  });
});
