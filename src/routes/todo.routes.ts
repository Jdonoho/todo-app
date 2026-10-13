
import { Router } from "express";

import { TodoController } from "../controllers/todo.controller";

export function createTodoRoutes(controller: TodoController) {
  const router = Router();

  router.get("/", controller.list);
  router.get("/new", controller.newForm);
  router.post("/", controller.create);

  router.get("/:id", controller.show);
  router.get("/:id/edit", controller.editForm);
  router.post("/:id/edit", controller.update);

  router.post("/:id/completion", controller.toggleCompletion);
  router.post("/:id/delete", controller.delete);

  return router;
}
