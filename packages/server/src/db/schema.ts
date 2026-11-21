import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  date,
  doublePrecision,
  foreignKey,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

// Sign-in tables, matching the fields Better Auth 1.7 expects

const createdAt = () =>
  timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  // IANA name from the app, used to start each recall day at 4 a.m. local time
  timeZone: text("time_zone"),
  // Raises the recall target in the 4 weeks before it
  interviewDate: date("interview_date", { mode: "string" }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    // Last time the password was typed again on this session, for "Confirm it's you"
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (table) => [index("sessions_user_id_idx").on(table.userId)],
);

export const accounts = pgTable(
  "accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", {
      withTimezone: true,
    }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
      withTimezone: true,
    }),
    scope: text("scope"),
    password: text("password"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [index("accounts_user_id_idx").on(table.userId)],
);

// Sign-in with an unlinked provider stays refused until it's linked again from Account
export const unlinkedProviders = pgTable(
  "unlinked_providers",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    providerId: text("provider_id").notNull(),
    createdAt: createdAt(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.providerId] })],
);

export const verifications = pgTable(
  "verifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [index("verifications_identifier_idx").on(table.identifier)],
);

export const rateLimits = pgTable("rate_limits", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: text("key").notNull().unique(),
  count: integer("count").notNull(),
  lastRequest: bigint("last_request", { mode: "number" }).notNull(),
});

// Recall progress, one row per card a user has started
export const recallCards = pgTable(
  "recall_cards",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    trackId: text("track_id").notNull(),
    chapterId: text("chapter_id").notNull(),
    cardId: text("card_id").notNull(),
    // Keeps new cards in the chapter's own order
    position: integer("position").notNull(),
    // The content version last shown, so a changed card keeps its schedule
    cardVersion: integer("card_version").notNull(),
    stability: doublePrecision("stability").notNull(),
    stabilityFast: doublePrecision("stability_fast").notNull(),
    difficulty: doublePrecision("difficulty").notNull(),
    state: smallint("state").notNull(),
    scheduleStatus: text("schedule_status").notNull(),
    reps: integer("reps").notNull(),
    lapses: integer("lapses").notNull(),
    scheduledDays: doublePrecision("scheduled_days").notNull(),
    learningStep: integer("learning_step").notNull(),
    dueAt: timestamp("due_at", { withTimezone: true }).notNull(),
    lastReviewAt: timestamp("last_review_at", { withTimezone: true }),
    // Only this review can be undone
    lastReviewId: uuid("last_review_id"),
    schedulerVersion: text("scheduler_version").notNull(),
    addedAt: timestamp("added_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({
      columns: [table.userId, table.trackId, table.chapterId, table.cardId],
    }),
    index("recall_cards_user_due_idx").on(table.userId, table.dueAt),
  ],
);

// Every review and undo, only ever added to
export const recallReviews = pgTable(
  "recall_reviews",
  {
    // Made by the app, so a retried request counts once
    id: uuid("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    trackId: text("track_id").notNull(),
    chapterId: text("chapter_id").notNull(),
    cardId: text("card_id").notNull(),
    cardVersion: integer("card_version").notNull(),
    // 1 Again, 2 Hard, 3 Good, 4 Easy, and empty on an undo
    rating: smallint("rating"),
    // The card's FSRS state before the review: 0 new, 1 learning, 2 review, 3 relearning
    state: smallint("state"),
    answeredAt: timestamp("answered_at", { withTimezone: true }),
    reviewTime: timestamp("review_time", { withTimezone: true }),
    durationMs: integer("duration_ms"),
    dueAt: timestamp("due_at", { withTimezone: true }),
    // What ts-fsrs needs to put the card back
    revlog: jsonb("revlog"),
    recallTarget: doublePrecision("recall_target"),
    schedulerVersion: text("scheduler_version").notNull(),
    undoes: uuid("undoes").unique(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    foreignKey({ columns: [table.undoes], foreignColumns: [table.id] }),
    check(
      "recall_reviews_review_or_undo",
      sql`(${table.rating} is null) = (${table.undoes} is not null)`,
    ),
    index("recall_reviews_user_time_idx").on(table.userId, table.reviewTime),
  ],
);
