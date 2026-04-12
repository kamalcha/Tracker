import { db } from '$lib/db';
import { timeLogs } from '$lib/db/schema';
import { desc, eq } from 'drizzle-orm';

export const load = async ({ locals, cookies }) => {
    const userId = Number(cookies.get('user_id'));

    const logs = await db.select()
        .from(timeLogs)
        .where(eq(timeLogs.userId, userId))
        .orderBy(desc(timeLogs.startTime));

    // Group logs by date
    const groupedLogs = logs.reduce((acc, log) => {
        if (!acc[log.date]) {
            acc[log.date] = { date: log.date, totalSeconds: 0, entries: [] };
        }
        acc[log.date].entries.push(log);
        acc[log.date].totalSeconds += (log.duration || 0);
        return acc;
    }, {} as Record<string, any>);

    return {
        // Convert object to array and sort by date descending
        dailyLogs: Object.values(groupedLogs).sort((a, b) => b.date.localeCompare(a.date))
    };
};