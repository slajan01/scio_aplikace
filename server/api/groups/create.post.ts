// server/api/groups/create.post.ts
import { serverSupabaseUser } from '#supabase/server';
import { db } from '~/server/db';
import { groups, goals } from '~/server/db/schema'; // Přidán import goals

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }

  const body = await readBody(event);
  if (!body.name || !body.goalDescription) {
    throw createError({ statusCode: 400, message: 'Chybí název nebo popis cíle' });
  }

  // Vložíme novou skupinu a rovnou si vezmeme její ID
  const [newGroup] = await db.insert(groups).values({
    name: body.name,
    goalDescription: body.goalDescription,
    ownerId: user.id,
  }).returning({ id: groups.id });

  // Prototyp: Automaticky vytvoříme jeden procentuální cíl pro tuto skupinu
  await db.insert(goals).values({
    groupId: newGroup.id,
    description: body.goalDescription, // Cíl je stejný jako popis skupiny
    type: 'percentage',
    targetValue: 3, // Prototyp: cíl má 3 kroky (např. 3 rovnice)
  });

  return newGroup;
});