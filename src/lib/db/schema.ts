import { pgTable, serial, text, timestamp, integer, unique, boolean } from 'drizzle-orm/pg-core';

export const organizations = pgTable('organizations', {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const users = pgTable('users', {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    password: text('password').notNull(),
    role: text('role').$type<'Manager' | 'Employee'>().default('Employee').notNull(),
    organizationId: integer('organization_id')
        .notNull()
        .references(() => organizations.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    status: text('status').$type<'Active' | 'Inactive' | 'Pending'>().default('Active').notNull(),
});

export const invitations = pgTable('invitations', {
    token: text('token').primaryKey(), // The unique "key" in the link
    email: text('email').notNull(),
    organizationId: integer('organization_id')
        .notNull()
        .references(() => organizations.id),
    status: text('status')
        .$type<'Sent' | 'Expired' | 'Revoked' | 'Joined'>()
        .default('Sent')
        .notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const timeLogs = pgTable('time_logs', {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
        .notNull()
        .references(() => users.id),
    taskId: integer('task_id') // Add this column
        .references(() => tasks.id),
    date: text('date').notNull(),
    startTime: timestamp('start_time', { withTimezone: true }).notNull(),
    endTime: timestamp('end_time', { withTimezone: true }),
    duration: integer('duration').default(0),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).defaultNow(),
});

export const dailySummaries = pgTable('daily_summaries', {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
        .notNull()
        .references(() => users.id),
    date: text('date').notNull(), // Format: YYYY-MM-DD
    manualTotalSeconds: integer('manual_total_seconds').notNull().default(0),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (t) => ({
    // Ensures only one summary record exists per user per day
    unq: unique().on(t.userId, t.date),
}));

export const projects = pgTable('projects', {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    userId: integer('user_id')
        .notNull()
        .references(() => users.id),
    isArchived: boolean('is_archived').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const tasks = pgTable('tasks', {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    userId: integer('user_id')
        .notNull()
        .references(() => users.id),
    projectId: integer('project_id')
        .references(() => projects.id),
    status: text('status').default('Todo').notNull(),
    completed: boolean('completed').default(false).notNull(),
    isArchived: boolean('is_archived').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});