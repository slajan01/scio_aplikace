// server/routes/ws/group/[id].ts
import { db } from '~/server/db';
import { messages, goals, studentProgress, students } from '~/server/db/schema';
import { and, eq } from 'drizzle-orm';
import { analyzeMessage } from '~/server/utils/ai';

const connections = new Map<string, Set<any>>();

export default defineWebSocketHandler({
  open(peer) {
    const url = peer._internal?.request?._url || '';
    const parts = url.split('/');
    const groupId = parts.pop();

    if (!groupId || groupId.length < 36) {
      return peer.close(1008, 'Chybějící nebo neplatné ID skupiny');
    }
    
    peer.userData = { groupId };
    if (!connections.has(groupId)) {
      connections.set(groupId, new Set());
    }
    connections.get(groupId)?.add(peer);
    console.log(`[ws] Peer se připojil do skupiny ${groupId}`);
  },

  async message(peer, message) {
    const groupId = peer.userData?.groupId;
    if (!groupId) return;

    const data = JSON.parse(message.text());
    if (data.type === 'ping') return peer.send(JSON.stringify({ type: 'pong' }));

    const [student] = await db.select().from(students).where(eq(students.deviceIdentifier, data.deviceId));
    const [goal] = await db.select().from(goals).where(eq(goals.groupId, groupId));
    if (!student || !goal) return console.error("Student nebo cíl nenalezen.");

    let [progress] = await db.select().from(studentProgress).where(and(eq(studentProgress.studentId, student.id), eq(studentProgress.goalId, goal.id)));
    if (!progress) {
      [progress] = await db.insert(studentProgress).values({ studentId: student.id, goalId: goal.id }).returning();
    }

    const analysis = await analyzeMessage(data.text, goal.description, progress.progress, goal.targetValue);

    await db.insert(messages).values({
      groupId,
      studentId: student.id,
      content: data.text,
      isRelevant: analysis.isRelevant,
    });

    if (analysis.progressIncrement > 0) {
      const newProgressValue = Math.min(progress.progress + analysis.progressIncrement, goal.targetValue);
      const [updatedProgress] = await db.update(studentProgress)
        .set({ progress: newProgressValue })
        .where(eq(studentProgress.studentId, student.id))
        .returning();
      progress = updatedProgress;
    }
    
    // Sestavíme finální zprávu - PŘIDÁME INFO O STUDENTOVI
    const broadcastPayload = {
      type: 'update',
      student: { id: student.id, nickname: student.nickname }, // << TATO ČÁST JE NOVÁ
      message: { ...data, isRelevant: analysis.isRelevant, feedback: analysis.feedback },
      progress: {
        current: progress.progress,
        target: goal.targetValue,
        percentage: Math.round((progress.progress / goal.targetValue) * 100),
      },
      needsHelp: analysis.needsHelp,
    };

    connections.get(groupId)?.forEach(p => {
      p.send(JSON.stringify(broadcastPayload));
    });
  },


  close(peer) {
    const groupId = peer.userData?.groupId;
    if (!groupId) return;
    connections.get(groupId)?.delete(peer);
    console.log(`[ws] Peer se odpojil ze skupiny ${groupId}`);
  },

  error(peer, error) {
    console.error(`[ws] Chyba u peera:`, error);
  },
});