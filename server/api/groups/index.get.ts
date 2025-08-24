import { serverSupabaseUser } from '#supabase/server';
import { db } from '~/server/db';
import { groups } from '~/server/db/schema';
import { eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }

  const userGroups = await db.select()
    .from(groups)
    .where(eq(groups.ownerId, user.id));

  return userGroups;
});