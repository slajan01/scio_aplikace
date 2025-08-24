// server/api/students/[id]/messages.get.ts
import { db } from '~/server/db';
import { messages } from '~/server/db/schema';
import { and, eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const studentId = getRouterParam(event, 'id');
  if (!studentId) {
    throw createError({ statusCode: 400, message: 'Chybí ID studenta' });
  }

  // Najdeme všechny zprávy, které patří danému studentovi A JSOU RELEVANTNÍ
  const relevantMessages = await db.select({
      content: messages.content,
      createdAt: messages.createdAt,
    })
    .from(messages)
    .where(and(
      eq(messages.studentId, studentId),
      eq(messages.isRelevant, true) // Klíčová podmínka
    ));
    // .orderBy(asc(messages.createdAt)); // Seřazení od nejstarší (volitelné)

  return relevantMessages;
});