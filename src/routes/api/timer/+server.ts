import { json } from '@sveltejs/kit';
import { db } from '$lib/db';
import { timeLogs } from '$lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';

export async function POST({ request, cookies }) {
    const userId = Number(cookies.get('user_id'));
    if (!userId) return json({ error: 'Unauthorized' }, { status: 401 });

    const { action, date } = await request.json();

    if (action === 'start') {
        await db.insert(timeLogs).values({
            userId,
            date,
            startTime: new Date()
        });
        return json({ success: true });
    }

    if (action === 'stop') {
        const now = new Date();

        // Find the open log for this user today
        const [activeLog] = await db.select()
            .from(timeLogs)
            .where(and(
                eq(timeLogs.userId, userId),
                eq(timeLogs.date, date),
                isNull(timeLogs.endTime)
            ))
            .limit(1);

        if (activeLog) {
            const duration = Math.floor((now.getTime() - activeLog.startTime.getTime()) / 1000);
            await db.update(timeLogs)
                .set({ endTime: now, duration })
                .where(eq(timeLogs.id, activeLog.id));
        }

        return json({ success: true });
    }

    return json({ error: 'Invalid action' }, { status: 400 });
}