import { db } from '~/server/db';
import { groups } from '~/server/db/schema';
import { eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const groupId = getRouterParam(event, 'id');

  if (!groupId) {
    throw createError({ statusCode: 400, message: 'Chybí ID skupiny' });
  }

  const [group] = await db.select()
    .from(groups)
    .where(eq(groups.id, groupId));

  if (!group) {
    throw createError({ statusCode: 404, message: 'Skupina nenalezena' });
  }

  return group;
});