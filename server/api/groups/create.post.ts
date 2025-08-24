// server/api/groups/create.post.ts
import { serverSupabaseUser } from '#supabase/server';
import { db } from '~/server/db';
import { groups, goals, users } from '~/server/db/schema'; // Přidán import users
import { eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  if (!user || !user.email) {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }

  const body = await readBody(event);
  if (!body.name || !body.goalDescription) {
    throw createError({ statusCode: 400, message: 'Chybí název nebo popis cíle' });
  }

  // --- KROK NAVÍC: ZAJIŠTĚNÍ EXISTENCE UŽIVATELE ---
  // Zkusíme najít uživatele v naší veřejné tabulce
  const [existingUser] = await db.select().from(users).where(eq(users.id, user.id));

  // Pokud neexistuje, vytvoříme ho
  if (!existingUser) {
    await db.insert(users).values({
      id: user.id,
      email: user.email,
    });
  }
  // --------------------------------------------------

  const [newGroup] = await db.insert(groups).values({
    name: body.name,
    goalDescription: body.goalDescription,
    ownerId: user.id,
  }).returning({ id: groups.id });

  await db.insert(goals).values({
    groupId: newGroup.id,
    description: body.goalDescription,
    type: 'percentage',
    targetValue: 3,
  });

  return newGroup;
});