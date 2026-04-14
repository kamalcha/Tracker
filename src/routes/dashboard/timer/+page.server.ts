import { db } from '$lib/db';
import { timeLogs, dailySummaries, tasks, projects } from '$lib/db/schema';
import { desc, eq, and, sql, asc, inArray } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';

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

    // 3. Fetch all projects for the dropdown
    const userProjects = await db.select()
        .from(projects)
        .where(and(eq(projects.userId, userId), eq(projects.isArchived, false)))
        .orderBy(asc(projects.name));

    // 4. Fetch non-archived tasks with non-archived projects
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
        .where(and(
            eq(tasks.userId, userId),
            eq(tasks.isArchived, false),
            // Ensure we don't show tasks from archived projects
            sql`(${tasks.projectId} IS NULL OR ${projects.isArchived} = false)`
        ))
        .orderBy(asc(tasks.id));

    // 5. Group logs and tie tasks by date
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
    },

    // Permanent delete action for one or multiple tasks
    deleteTasks: async ({ request }) => {
        const data = await request.formData();
        const ids = data.get('ids')?.toString().split(',').map(Number);

        if (ids && ids.length > 0) {
            await db.delete(tasks).where(inArray(tasks.id, ids));
        }
        return { success: true };
    },

    // BULK DELETE & WIPE DAY PROTOCOL
    deleteBulk: async ({ request, cookies }) => {
        const userId = Number(cookies.get('user_id'));
        const data = await request.formData();
        const taskIds = data.get('taskIds')?.toString().split(',').filter(Boolean).map(Number) || [];
        const wipeDates = data.get('wipeDates')?.toString().split(',').filter(Boolean) || [];

        // 1. Delete selected Tasks 
        if (taskIds.length > 0) {
            await db.delete(tasks).where(inArray(tasks.id, taskIds));
        }

        // 2. Wipe Day (Logs and Summaries) if Date Checkbox was used 
        if (wipeDates.length > 0) {
            // Delete all time logs for these dates
            await db.delete(timeLogs).where(and(eq(timeLogs.userId, userId), inArray(timeLogs.date, wipeDates)));

            // Delete all daily summaries for these dates
            await db.delete(dailySummaries).where(and(eq(dailySummaries.userId, userId), inArray(dailySummaries.date, wipeDates)));
        }

        // Delete ALL tasks for these dates (including archived) to prevent orphans
        // This targets tasks by their creation date string
        for (const date of wipeDates) {
            await db.delete(tasks).where(and(
                eq(tasks.userId, userId),
                sql`DATE(${tasks.createdAt}) = ${date}`
            ));
        }

        return { success: true };
    },
};