import { pgTable, text, varchar, timestamp, uuid, primaryKey, integer, boolean } from 'drizzle-orm/pg-core';

// Učitelé - propojeno se Supabase Auth
export const users = pgTable('users', {
  id: uuid('id').primaryKey(), // Supabase user ID
  email: text('email').notNull(),
});

// Skupiny vytvořené učiteli
export const groups = pgTable('groups', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 256 }).notNull(),
  goalDescription: text('goal_description').notNull(),
  ownerId: uuid('owner_id').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
});

// Studenti ve skupinách
export const students = pgTable('students', {
  id: uuid('id').primaryKey().defaultRandom(),
  groupId: uuid('group_id').notNull().references(() => groups.id, { onDelete: 'cascade' }),
  nickname: varchar('nickname', { length: 256 }).notNull(),
  deviceIdentifier: text('device_identifier').notNull().unique(), // Unikátní otisk z localStorage
});

// Cíle pro jednotlivé skupiny
export const goals = pgTable('goals', {
  id: uuid('id').primaryKey().defaultRandom(),
  groupId: uuid('group_id').notNull().references(() => groups.id, { onDelete: 'cascade' }),
  description: text('description').notNull(),
  type: varchar('type', { enum: ['boolean', 'percentage'] }).notNull(),
  targetValue: integer('target_value').default(100), // např. počet rovnic pro 100 %
});

// Sledování pokroku studentů
export const studentProgress = pgTable('student_progress', {
  studentId: uuid('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  goalId: uuid('goal_id').notNull().references(() => goals.id, { onDelete: 'cascade' }),
  progress: integer('progress').default(0), // 0/1 pro boolean, 0-100 pro percentage
  isCompleted: boolean('is_completed').default(false),
}, (table) => ({
  pk: primaryKey({ columns: [table.studentId, table.goalId] }),
}));

// Zprávy v chatu
export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  groupId: uuid('group_id').notNull().references(() => groups.id, { onDelete: 'cascade' }),
  studentId: uuid('student_id').references(() => students.id), // NULL pro systémové zprávy
  content: text('content').notNull(),
  isRelevant: boolean('is_relevant').default(false), // Pro zvýraznění zprávy
  createdAt: timestamp('created_at').defaultNow(),
});