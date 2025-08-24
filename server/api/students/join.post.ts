import { db } from '~/server/db';
import { students } from '~/server/db/schema';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  if (!body.groupId || !body.nickname || !body.deviceIdentifier) {
    throw createError({ 
      statusCode: 400, 
      message: 'Chybí potřebné údaje pro připojení' 
    });
  }

  const newStudent = await db.insert(students).values({
    groupId: body.groupId,
    nickname: body.nickname,
    deviceIdentifier: body.deviceIdentifier,
  }).returning();

  return newStudent[0];
});