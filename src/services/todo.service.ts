
import type { Todo } from "../models/todo";
import type { TodoRepository } from "../repositories/todo.repository";
import type { z } from "zod";
import { createTodoSchema } from "../validation/todo.schema";

type TodoInput = z.input<typeof createTodoSchema>;

export class TodoService {
  constructor(private readonly repository: TodoRepository) {}

  async listTodos(): Promise<Todo[]> {
    return this.repository.findAll();
  }

  async getTodo(id: string): Promise<Todo | undefined> {
    return this.repository.findById(id);
  }

  async createTodo(input: TodoInput): Promise<Todo> {
    const todo = {
      ...input,
      isCompleted: false,
      createdAt: new Date().toISOString(),
    };

    return this.repository.create(todo);
  }

  async updateTodo(
    id: string,
    input: TodoInput
  ): Promise<Todo | undefined> {
    const existingTodo = await this.repository.findById(id);

    if (!existingTodo) {
      return undefined;
    }

    const updatedTodo: Todo = {
      ...existingTodo,
      title: input.title,
      description: input.description,
      dueDate: input.dueDate,
    };

    return this.repository.update(id, updatedTodo);
  }

  async setCompletion(
    id: string,
    isCompleted: boolean
  ): Promise<Todo | undefined> {
    const existingTodo = await this.repository.findById(id);

    if (!existingTodo) {
      return undefined;
    }

    return this.repository.update(id, {
      ...existingTodo,
      isCompleted,
    });
  }

  async deleteTodo(id: string): Promise<boolean> {
    return this.repository.delete(id);
  }
}
