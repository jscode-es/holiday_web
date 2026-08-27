import { sqliteTable, integer, text, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import type { Tag } from "@/lib/tags";

export const trips = sqliteTable("trips", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  emoji: text("emoji"),
  startDate: text("start_date"),
  endDate: text("end_date"),
  travelers: integer("travelers"),
  displayCurrency: text("display_currency", { enum: ["EUR", "JPY"] }),
  eurToJpyRate: real("eur_to_jpy_rate"),
  shareToken: text("share_token").unique(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
});

export const days = sqliteTable("days", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  tripId: integer("trip_id")
    .notNull()
    .references(() => trips.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  dayNumber: integer("day_number").notNull(),
  title: text("title").notNull(),
  summary: text("summary"),
  imageUrl: text("image_url"),
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
  viaLabel: text("via_label"),
  viaLat: real("via_lat"),
  viaLng: real("via_lng"),
  imageUrl: text("image_url"),
  videoUrl: text("video_url"),
});

export const accommodations = sqliteTable("accommodations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  tripId: integer("trip_id")
    .notNull()
    .references(() => trips.id, { onDelete: "cascade" }),
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
  confirmationNumber: text("confirmation_number"),
  roomType: text("room_type"),
  cancellationPolicy: text("cancellation_policy"),
  phone: text("phone"),
});

export const checklistItems = sqliteTable("checklist_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  tripId: integer("trip_id")
    .notNull()
    .references(() => trips.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  done: integer("done", { mode: "boolean" }).notNull().default(false),
});

export const bags = sqliteTable("bags", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  tripId: integer("trip_id")
    .notNull()
    .references(() => trips.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
});

export const bagItems = sqliteTable("bag_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  bagId: integer("bag_id")
    .notNull()
    .references(() => bags.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  packed: integer("packed", { mode: "boolean" }).notNull().default(false),
});

export const notes = sqliteTable("notes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  tripId: integer("trip_id")
    .notNull()
    .references(() => trips.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  body: text("body"),
  mediaUrl: text("media_url"),
  tags: text("tags", { mode: "json" }).$type<Tag[]>(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
});

export const utilities = sqliteTable("utilities", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  tripId: integer("trip_id")
    .notNull()
    .references(() => trips.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  url: text("url"),
  mediaUrl: text("media_url"),
  tags: text("tags", { mode: "json" }).$type<Tag[]>(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
});
