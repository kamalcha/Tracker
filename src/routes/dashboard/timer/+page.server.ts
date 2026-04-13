import { db } from '$lib/db';
import { timeLogs, dailySummaries } from '$lib/db/schema';
import { desc, eq, and } from 'drizzle-orm';

export const load = async ({ locals, cookies }) => {
    const userId = Number(cookies.get('user_id'));

    const logs = await db.select()
        .from(timeLogs)
        .where(eq(timeLogs.userId, userId))
        .orderBy(desc(timeLogs.startTime));

    // 2. Fetch all manual overrides
    const summaries = await db.select()
        .from(dailySummaries)
        .where(eq(dailySummaries.userId, userId));

    const summaryMap = new Map(summaries.map(s => [s.date, s.manualTotalSeconds]));

    // 3. Group and merge
    const groupedLogs = logs.reduce((acc, log) => {
        if (!acc[log.date]) {
            // Priority: Manual Override > Calculated Sum
            const manualTotal = summaryMap.get(log.date);
            acc[log.date] = {
                date: log.date,
                totalSeconds: manualTotal ?? 0,
                isManual: manualTotal !== undefined,
                calculatedSum: 0,
                entries: []
            };
        }
        acc[log.date].entries.push(log);
        acc[log.date].calculatedSum += (log.duration || 0);

        // If no manual override exists, keep the live calculated sum as total
        if (!acc[log.date].isManual) {
            acc[log.date].totalSeconds = acc[log.date].calculatedSum;
        }

        return acc;
    }, {} as Record<string, any>);

    return {
        // Convert object to array and sort by date descending
        dailyLogs: Object.values(groupedLogs).sort((a, b) => b.date.localeCompare(a.date))
    };
};