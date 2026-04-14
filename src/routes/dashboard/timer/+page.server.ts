import { db } from '$lib/db';
import { timeLogs, dailySummaries, tasks, projects } from '$lib/db/schema';
import { desc, eq, and, sql, asc } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';

export const load = async ({ cookies }) => {
    const userId = Number(cookies.get('user_id'));

    // Fetch raw time sessions
    const logs = await db.select()
        .from(timeLogs)
        .where(eq(timeLogs.userId, userId))
        .orderBy(desc(timeLogs.startTime));

    // Fetch all manual overrides
    const summaries = await db.select()
        .from(dailySummaries)
        .where(eq(dailySummaries.userId, userId));

    const summaryMap = new Map(summaries.map(s => [s.date, s.manualTotalSeconds]));

    // Fetch all projects for the dropdown
    const userProjects = await db.select()
        .from(projects)
        .where(eq(projects.userId, userId))
        .orderBy(asc(projects.name));

    // Fetch tasks joined with projects
    const allTasks = await db.select({
        id: tasks.id,
        name: tasks.name,
        status: tasks.status,
        createdAt: tasks.createdAt,
        projectId: tasks.projectId,
        projectName: projects.name
    })
        .from(tasks)
        .leftJoin(projects, eq(tasks.projectId, projects.id))
        .where(eq(tasks.userId, userId))
        .orderBy(asc(tasks.id));

    // Group logs by date
    const groupedData = logs.reduce((acc, log) => {
        if (!acc[log.date]) {
            const manualTotal = summaryMap.get(log.date);
            acc[log.date] = {
                date: log.date,
                totalSeconds: manualTotal ?? 0,
                isManual: manualTotal !== undefined,
                calculatedSum: 0,
                entries: [],
                dayTasks: []
            };
        }
        acc[log.date].entries.push(log);
        acc[log.date].calculatedSum += (log.duration || 0);

        if (!acc[log.date].isManual) {
            acc[log.date].totalSeconds = acc[log.date].calculatedSum;
        }
        return acc;
    }, {} as Record<string, any>);

    // Tie Tasks to Dates based on createdAt
    allTasks.forEach(task => {
        const taskDate = task.createdAt ? new Date(task.createdAt).toISOString().split('T')[0] : '';
        if (taskDate) {
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
        dailyLogs: Object.values(groupedData).sort((a, b) => b.date.localeCompare(a.date)),
        projects: userProjects
    };
};

export const actions = {
    updateTask: async ({ request }) => {
        const data = await request.formData();
        const id = Number(data.get('id'));
        const updateFields: any = {};

        if (data.has('status')) {
            const status = data.get('status')?.toString();
            updateFields.status = status;
            updateFields.completed = status === 'Done';
        }

        if (data.has('projectId')) {
            const val = data.get('projectId');
            updateFields.projectId = (val === "" || val === null) ? null : Number(val);
        }

        if (Object.keys(updateFields).length > 0) {
            await db.update(tasks).set(updateFields).where(eq(tasks.id, id));
        }

        return { success: true };
    }
};