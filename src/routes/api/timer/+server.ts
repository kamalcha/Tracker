import { json } from '@sveltejs/kit';
import { db } from '$lib/db';
import { timeLogs, dailySummaries } from '$lib/db/schema';
import { eq, and, isNull, sql } from 'drizzle-orm';

export async function POST({ request, cookies }) {
    const userId = Number(cookies.get('user_id'));
    if (!userId) return json({ error: 'Unauthorized' }, { status: 401 });

    const { action, date, totalSeconds } = await request.json();

    if (action === 'manual_save') {
        await db.insert(dailySummaries)
            .values({ userId, date, manualTotalSeconds: totalSeconds })
            .onConflictDoUpdate({
                target: [dailySummaries.userId, dailySummaries.date],
                set: { manualTotalSeconds: totalSeconds, updatedAt: new Date() }
            });
        return json({ success: true });
    }

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
        const [activeLog] = await db.select().from(timeLogs)
            .where(and(eq(timeLogs.userId, userId), isNull(timeLogs.endTime)))
            .limit(1);

        if (activeLog) {
            const duration = Math.floor((now.getTime() - activeLog.startTime.getTime()) / 1000);

            // 1. Close the log
            await db.update(timeLogs).set({ endTime: now, duration }).where(eq(timeLogs.id, activeLog.id));

            // 2. Option A: Add duration to summary (if it exists) or create it from the current day's sum
            const currentTotal = await db.select().from(dailySummaries)
                .where(and(eq(dailySummaries.userId, userId), eq(dailySummaries.date, date)))
                .limit(1);

            let newTotal = duration;
            if (currentTotal.length > 0) {
                newTotal = currentTotal[0].manualTotalSeconds + duration;
            } else {
                // If no summary exists, get sum of all logs for today
                const [sumResult] = await db.select({ total: sql<number>`sum(${timeLogs.duration})` })
                    .from(timeLogs)
                    .where(and(eq(timeLogs.userId, userId), eq(timeLogs.date, date)));
                newTotal = Number(sumResult?.total || 0);
            }

            await db.insert(dailySummaries)
                .values({ userId, date, manualTotalSeconds: newTotal })
                .onConflictDoUpdate({
                    target: [dailySummaries.userId, dailySummaries.date],
                    set: { manualTotalSeconds: newTotal, updatedAt: new Date() }
                });
        }
        return json({ success: true });
    }

    return json({ error: 'Invalid action' }, { status: 400 });
}