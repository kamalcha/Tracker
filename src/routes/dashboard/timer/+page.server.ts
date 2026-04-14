import { db } from '$lib/db';
import { timeLogs, dailySummaries, tasks, projects } from '$lib/db/schema';
import { desc, eq, and, sql } from 'drizzle-orm';

export const load = async ({ cookies }) => {
    const userId = Number(cookies.get('user_id'));

    // 1. Fetch raw time sessions
    const logs = await db.select()
        .from(timeLogs)
        .where(eq(timeLogs.userId, userId))
        .orderBy(desc(timeLogs.startTime));

    // 2. Fetch all manual overrides
    const summaries = await db.select()
        .from(dailySummaries)
        .where(eq(dailySummaries.userId, userId));

    const summaryMap = new Map(summaries.map(s => [s.date, s.manualTotalSeconds]));

    // 3. Fetch all tasks joined with projects
    const allTasks = await db.select({
        id: tasks.id,
        name: tasks.name,
        status: tasks.status,
        createdAt: tasks.createdAt,
        projectName: projects.name
    })
        .from(tasks)
        .leftJoin(projects, eq(tasks.projectId, projects.id))
        .where(eq(tasks.userId, userId));

    // 4. Group by Date
    const groupedData = logs.reduce((acc, log) => {
        if (!acc[log.date]) {
            const manualTotal = summaryMap.get(log.date);
            acc[log.date] = {
                date: log.date,
                totalSeconds: manualTotal ?? 0,
                isManual: manualTotal !== undefined,
                calculatedSum: 0,
                entries: [],
                dayTasks: [] // Placeholder for tasks
            };
        }
        acc[log.date].entries.push(log);
        acc[log.date].calculatedSum += (log.duration || 0);

        if (!acc[log.date].isManual) {
            acc[log.date].totalSeconds = acc[log.date].calculatedSum;
        }
        return acc;
    }, {} as Record<string, any>);

    // 5. Tie Tasks to Dates (based on createdAt)
    allTasks.forEach(task => {
        const taskDate = task.createdAt ? new Date(task.createdAt).toISOString().split('T')[0] : '';
        if (taskDate) {
            // If the date card doesn't exist yet (e.g. task created but no time logged), create it
            if (!groupedData[taskDate]) {
                groupedData[taskDate] = {
                    date: taskDate,
                    totalSeconds: 0,
                    isManual: false,
                    calculatedSum: 0,
                    entries: [],
                    dayTasks: []
                };
            }
            groupedData[taskDate].dayTasks.push(task);
        }
    });

    return {
        dailyLogs: Object.values(groupedData).sort((a, b) => b.date.localeCompare(a.date))
    };
};