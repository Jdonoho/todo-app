
import type { Todo } from "../models/todo";

export interface TodoRepository {
  findAll(): Promise<Todo[]>;

  findById(id: string): Promise<Todo | undefined>;

  create(todo: Omit<Todo, "id">): Promise<Todo>;

  update(
    id: string,
    todo: Todo
  ): Promise<Todo | undefined>;

  delete(id: string): Promise<boolean>;
}
