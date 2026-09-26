import {
  pgTable,
  serial,
  text,
  timestamp,
  boolean,
  integer,
  numeric,
  index,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),

  // Login credentials
  email: text("email").unique(),
  password_hash: text("password_hash"),

  // Existing profile data
  name: text("name").notNull().default("Alex"),
  avatar: text("avatar").default(""),
  timezone: text("timezone").default("America/New_York"),
  date_format: text("date_format").default("MM/DD/YYYY"),
  theme: text("theme"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id"),
  title: text("title").notNull(),
  description: text("description").default(""),
  target_date: text("target_date"), // YYYY-MM-DD for one-time tasks or start reference
  target_time: text("target_time").default("09:00"),
  recurrence: text("recurrence").default("daily"), // 'daily', 'weekly', 'custom', 'one-time'
  recurrence_days: text("recurrence_days"), // JSON array of day numbers: e.g. [0,1,2,3,4,5,6] (0 = Sunday)
  requires_photo: boolean("requires_photo").default(false).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const task_completions = pgTable("task_completions", {
  id: serial("id").primaryKey(),
  task_id: integer("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  date: text("date").notNull(), // 'YYYY-MM-DD'
  completed_at: timestamp("completed_at").defaultNow().notNull(),
  image_url: text("image_url"),
  notes: text("notes"),
});

export const quotes = pgTable(
  "quotes",
  {
    id: serial("id").primaryKey(),
    user_id: integer("user_id"),
    text: text("text").notNull(),
    author: text("author"),
    background_image_url: text("background_image_url").notNull(),
    sort_order: integer("sort_order").notNull().default(0),
    created_at: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("quotes_user_created_idx").on(
      table.user_id,
      table.created_at
    ),
  ]
);

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id"),
  title: text("title").notNull(),
  message: text("message").notNull(),
  read: boolean("read").default(false).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Monetary values are stored as exact decimals, never JavaScript floating point numbers.
export const expenses = pgTable(
  "expenses",
  {
    id: serial("id").primaryKey(),
    user_id: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    category: text("category").notNull(),
    description: text("description"),
    payment_method: text("payment_method").notNull(),
    expense_date: text("expense_date").notNull(),
    expense_time: text("expense_time").notNull(),
    created_at: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("expenses_user_date_idx").on(
      table.user_id,
      table.expense_date
    ),
  ]
);

export type User = typeof users.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type TaskCompletion = typeof task_completions.$inferSelect;
export type Quote = typeof quotes.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type Expense = typeof expenses.$inferSelect;
