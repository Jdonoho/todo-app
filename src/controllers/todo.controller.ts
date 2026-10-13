
import type { Request, Response } from "express";

import { TodoService } from "../services/todo.service";
import {
  createTodoSchema,
  updateTodoSchema,
} from "../validation/todo.schema";


function getTodoId(req: Request): string {
  const id = getTodoId(req);

  if (typeof id !== "string") {
    throw new Error("Invalid todo ID.");
  }

  return id;
}


export class TodoController {
  constructor(private readonly service: TodoService) {}

  list = async (_req: Request, res: Response) => {
    const todos = await this.service.listTodos();

    res.render("todos/index", { todos });
  };

  newForm = (_req: Request, res: Response) => {
    res.render("todos/new", {
      errors: [],
      formData: {},
    });
  };

  create = async (req: Request, res: Response) => {
    const result = createTodoSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).render("todos/new", {
        errors: result.error.issues.map((issue) => issue.message),
        formData: req.body,
      });
    }

    await this.service.createTodo(result.data);

    return res.redirect("/todos");
  };

  show = async (req: Request, res: Response) => {
    const todo = await this.service.getTodo(getTodoId(req));

    if (!todo) {
      return res.status(404).send("Todo not found");
    }

    return res.render("todos/show", { todo });
  };

  editForm = async (req: Request, res: Response) => {
    const todo = await this.service.getTodo(getTodoId(req));

    if (!todo) {
      return res.status(404).send("Todo not found");
    }

    return res.render("todos/edit", {
      todo,
      errors: [],
      formData: todo,
    });
  };

  update = async (req: Request, res: Response) => {
    const result = updateTodoSchema.safeParse(req.body);

    if (!result.success) {
      const todo = await this.service.getTodo(getTodoId(req));

      if (!todo) {
        return res.status(404).send("Todo not found");
      }

      return res.status(400).render("todos/edit", {
        todo,
        errors: result.error.issues.map((issue) => issue.message),
        formData: req.body,
      });
    }

    const updatedTodo = await this.service.updateTodo(
      getTodoId(req),
      result.data
    );

    if (!updatedTodo) {
      return res.status(404).send("Todo not found");
    }

    return res.redirect(`/todos/${updatedTodo.id}`);
  };

  toggleCompletion = async (req: Request, res: Response) => {
    const todo = await this.service.getTodo(getTodoId(req));

    if (!todo) {
      return res.status(404).send("Todo not found");
    }

    await this.service.setCompletion(
      todo.id,
      !todo.isCompleted
    );

    return res.redirect(`/todos/${todo.id}`);
  };

  delete = async (req: Request, res: Response) => {
    const deleted = await this.service.deleteTodo(getTodoId(req));

    if (!deleted) {
      return res.status(404).send("Todo not found");
    }

    return res.redirect("/todos");
  };
}
