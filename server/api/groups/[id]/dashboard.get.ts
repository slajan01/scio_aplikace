// server/api/groups/[id]/dashboard.get.ts
import { db } from '~/server/db';
import { students, goals, studentProgress } from '~/server/db/schema';
import { and, eq } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

export default defineEventHandler(async (event) => {
  const groupId = getRouterParam(event, 'id');
  if (!groupId) throw createError({ statusCode: 400, message: 'Chybí ID skupiny' });

  // Najdeme hlavní cíl pro tuto skupinu
  const [goal] = await db.select().from(goals).where(eq(goals.groupId, groupId));
  if (!goal) return []; // Pokud skupina nemá cíl, vrátíme prázdné pole

  // Najdeme všechny studenty v této skupině
  const groupStudents = await db.select({
      id: students.id,
      nickname: students.nickname,
      progress: studentProgress.progress,
    })
    .from(students)
    .leftJoin(studentProgress, and(
      eq(students.id, studentProgress.studentId),
      eq(studentProgress.goalId, goal.id)
    ))
    .where(eq(students.groupId, groupId));

  // Zpracujeme data do finální podoby
  const dashboardData = groupStudents.map(s => ({
    ...s,
    progress: s.progress || 0, // Pokud student ještě nemá pokrok, bude 0
    target: goal.targetValue,
    percentage: Math.round(((s.progress || 0) / goal.targetValue) * 100),
    needsHelp: false, // Tuto hodnotu budeme aktualizovat přes WebSocket
  }));

  return dashboardData;
});