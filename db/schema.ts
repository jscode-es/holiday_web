import { sqliteTable, integer, text, real } from "drizzle-orm/sqlite-core";

export const days = sqliteTable("days", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  date: text("date").notNull(),
  dayNumber: integer("day_number").notNull(),
  title: text("title").notNull(),
  summary: text("summary"),
});

export const activities = sqliteTable("activities", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  dayId: integer("day_id")
    .notNull()
    .references(() => days.id, { onDelete: "cascade" }),
  time: text("time"),
  type: text("type", {
    enum: ["transport", "place", "event", "comida", "nota", "aviso", "hotel"],
  }).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status", { enum: ["programado", "confirmado", "pendiente"] }),
  cost: real("cost"),
  currency: text("currency", { enum: ["EUR", "JPY"] }),
  durationMin: integer("duration_min"),
  origin: text("origin"),
  destination: text("destination"),
  originLat: real("origin_lat"),
  originLng: real("origin_lng"),
  destLat: real("dest_lat"),
  destLng: real("dest_lng"),
  imageUrl: text("image_url"),
});

export const accommodations = sqliteTable("accommodations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  checkIn: text("check_in").notNull(),
  checkOut: text("check_out").notNull(),
  nights: integer("nights"),
  cost: real("cost"),
  currency: text("currency", { enum: ["EUR", "JPY"] }),
  status: text("status", {
    enum: ["programado", "confirmado", "pendiente"],
  }).notNull(),
  address: text("address"),
  lat: real("lat"),
  lng: real("lng"),
  notes: text("notes"),
});

export const checklistItems = sqliteTable("checklist_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  label: text("label").notNull(),
  done: integer("done", { mode: "boolean" }).notNull().default(false),
});
