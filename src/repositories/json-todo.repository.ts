
import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

import type { Todo } from "../models/todo";
import type { TodoRepository } from "./todo.repository";

export class JsonTodoRepository implements TodoRepository {
  private operationQueue: Promise<void> = Promise.resolve();

  constructor(private readonly filePath: string) {}

  private async withLock<T>(
    operation: () => Promise<T>
  ): Promise<T> {
    const result = this.operationQueue.then(operation);

    this.operationQueue = result.then(
      () => undefined,
      () => undefined
    );

    return result;
  }

  private async readTodos(): Promise<Todo[]> {
    await fs.mkdir(path.dirname(this.filePath), {
      recursive: true,
    });

    let contents: string;

    try {
      contents = await fs.readFile(this.filePath, "utf8");
    } catch (error) {
      if (
        (error as NodeJS.ErrnoException).code !== "ENOENT"
      ) {
        throw error;
      }

      await this.writeTodos([]);
      return [];
    }

    let data: unknown;

    try {
      data = JSON.parse(contents);
    } catch {
      throw new Error("Todo storage contains invalid JSON.");
    }

    if (!Array.isArray(data)) {
      throw new Error(
        "Todo storage must contain a JSON array."
      );
    }

    return data as Todo[];
  }

  private async writeTodos(todos: Todo[]): Promise<void> {
    await fs.mkdir(path.dirname(this.filePath), {
      recursive: true,
    });

    const temporaryPath =
      `${this.filePath}.${randomUUID()}.tmp`;

    try {
      await fs.writeFile(
        temporaryPath,
        JSON.stringify(todos, null, 2),
        "utf8"
      );

      await fs.rename(temporaryPath, this.filePath);
    } catch (error) {
      await fs.rm(temporaryPath, { force: true }).catch(
        () => undefined
      );

      throw error;
    }
  }

  async findAll(): Promise<Todo[]> {
    return this.withLock(async () => {
      return this.readTodos();
    });
  }

  async findById(id: string): Promise<Todo | undefined> {
    return this.withLock(async () => {
      const todos = await this.readTodos();
      return todos.find((todo) => todo.id === id);
    });
  }

  async create(todo: Omit<Todo, "id">): Promise<Todo> {
    return this.withLock(async () => {
      const todos = await this.readTodos();

      const newTodo: Todo = {
        ...todo,
        id: randomUUID(),
      };

      todos.push(newTodo);
      await this.writeTodos(todos);

      return newTodo;
    });
  }

  async update(
    id: string,
    todo: Todo
  ): Promise<Todo | undefined> {
    return this.withLock(async () => {
      const todos = await this.readTodos();
      const index = todos.findIndex(
        (existing) => existing.id === id
      );

      if (index === -1) {
        return undefined;
      }

      const updatedTodo: Todo = {
        ...todo,
        id,
      };

      todos[index] = updatedTodo;
      await this.writeTodos(todos);

      return updatedTodo;
    });
  }

  async delete(id: string): Promise<boolean> {
    return this.withLock(async () => {
      const todos = await this.readTodos();
      const remainingTodos = todos.filter(
        (todo) => todo.id !== id
      );

      if (remainingTodos.length === todos.length) {
        return false;
      }

      await this.writeTodos(remainingTodos);
      return true;
    });
  }
}
