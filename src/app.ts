
import express from "express";
import path from "node:path";

import { TodoController } from "./controllers/todo.controller";
import { JsonTodoRepository } from "./repositories/json-todo.repository";
import { createTodoRoutes } from "./routes/todo.routes";
import { TodoService } from "./services/todo.service";

export function createApp() {
  const app = express();

  app.set("view engine", "ejs");
  app.set("views", path.join(process.cwd(), "views"));

  app.use(express.urlencoded({ extended: false }));
  app.use(express.static(path.join(process.cwd(), "public")));

  const repository = new JsonTodoRepository(
    path.join(process.cwd(), "data", "todos.json")
  );

  const service = new TodoService(repository);
  const controller = new TodoController(service);

  app.get("/", (_req, res) => {
    res.redirect("/todos");
  });

  app.use("/todos", createTodoRoutes(controller));

  app.use((_req, res) => {
    res.status(404).send("Page not found");
  });

  return app;
}
