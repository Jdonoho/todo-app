
import { z } from "zod";

const dateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: "Due date must use YYYY-MM-DD format.",
  })
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);

    return (
      !Number.isNaN(date.getTime()) &&
      date.toISOString().slice(0, 10) === value
    );
  }, {
    message: "Due date must be a valid calendar date.",
  });

export const createTodoSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required.")
    .max(200, "Title must be 200 characters or fewer."),

  description: z
    .string()
    .trim()
    .max(2000, "Description must be 2000 characters or fewer.")
    .optional()
    .transform((value) => value || undefined),

  dueDate: z
    .union([dateOnlySchema, z.literal("")])
    .optional()
    .transform((value) => value || undefined),
});

export const updateTodoSchema = createTodoSchema;
