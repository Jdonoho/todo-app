
import { describe, expect, it } from "vitest";
import {
  createTodoSchema,
  updateTodoSchema,
} from "../../src/validation/todo.schema";

describe("createTodoSchema", () => {
  it("accepts a valid task", () => {
    const result = createTodoSchema.safeParse({
      title: "Finish interview assignment",
      description: "Complete the core functionality",
      dueDate: "2026-10-20",
    });

    expect(result.success).toBe(true);
  });

  it("rejects a blank title", () => {
    const result = createTodoSchema.safeParse({
      title: "   ",
    });

    expect(result.success).toBe(false);
  });

  it("accepts an omitted due date", () => {
    const result = createTodoSchema.safeParse({
      title: "Write tests",
      dueDate: "",
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.dueDate).toBeUndefined();
    }
  });

  it("rejects an impossible calendar date", () => {
    const result = createTodoSchema.safeParse({
      title: "Write tests",
      dueDate: "2026-02-30",
    });

    expect(result.success).toBe(false);
  });

  it("uses the same validation rules for updates", () => {
    expect(updateTodoSchema.safeParse({
      title: "Updated task",
    }).success).toBe(true);
  });
});
