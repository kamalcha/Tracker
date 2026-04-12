import { pgTable, serial, text, timestamp, integer } from 'drizzle-orm/pg-core';

export const organizations = pgTable('organizations', {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
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
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
    status: text('status').$type<'Active' | 'Inactive' | 'Pending'>().default('Active').notNull(),
});

export const invitations = pgTable('invitations', {
    token: text('token').primaryKey(), // The unique "key" in the link
    email: text('email').notNull(),
    organizationId: integer('organization_id')
        .notNull()
        .references(() => organizations.id),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
});

export const timeLogs = pgTable('time_logs', {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
        .notNull()
        .references(() => users.id),
    date: text('date').notNull(),
    startTime: timestamp('start_time', { withTimezone: true }).notNull(),
    endTime: timestamp('end_time', { withTimezone: true }),
    duration: integer('duration').default(0),
});