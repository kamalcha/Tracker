import { error, fail } from '@sveltejs/kit';
import { db } from '$lib/db';
import { timeLogs, dailySummaries, tasks, projects } from '$lib/db/schema';
import { desc, eq, and, sql, asc, inArray, gte, lte, isNull } from 'drizzle-orm';

// Helper to calculate Sunday-Saturday bounds
const getWeekBounds = (date: Date, tz: string) => {
    const localDate = new Date(date.toLocaleString("en-US", { timeZone: tz }));
    const sun = new Date(localDate);
    sun.setDate(localDate.getDate() - localDate.getDay());
    const sat = new Date(localDate);
    sat.setDate(localDate.getDate() - localDate.getDay() + 6);
    return {
        start: sun.toLocaleDateString('en-CA'),
        end: sat.toLocaleDateString('en-CA')
    };
};

// export const load = async ({ cookies, url, locals }) => {
//     const userId = Number(cookies.get('user_id'));

//     // 1. Get dates from URL or default to Current Week (Sunday - Saturday)
//     const startParam = url.searchParams.get('start');
//     const endParam = url.searchParams.get('end');

//     let startDate: string;
//     let endDate: string;

//     if (startParam && endParam) {
//         startDate = startParam;
//         endDate = endParam;
//     } else {
//         // const today = new Date();
//         // const sun = new Date(today.setDate(today.getDate() - today.getDay()));
//         // const sat = new Date(today.setDate(today.getDate() - today.getDay() + 6));
//         // startDate = sun.toLocaleDateString('en-CA');
//         // endDate = sat.toLocaleDateString('en-CA');
//         const now = new Date();
//         const sun = new Date(now);
//         sun.setDate(now.getDate() - now.getDay());

//         const sat = new Date(now);
//         sat.setDate(now.getDate() - now.getDay() + 6);

//         startDate = sun.toLocaleDateString('en-CA');
//         endDate = sat.toLocaleDateString('en-CA');
//     }

//     // 2. Fetch data restricted by the date range
//     // const [logs, summaries, allTasks, userProjects] = await Promise.all([
//     //     db.select().from(timeLogs).where(and(eq(timeLogs.userId, userId), gte(timeLogs.date, startDate), lte(timeLogs.date, endDate))).orderBy(desc(timeLogs.startTime)),
//     //     db.select().from(dailySummaries).where(and(eq(dailySummaries.userId, userId), gte(dailySummaries.date, startDate), lte(dailySummaries.date, endDate))),
//     //     db.select({
//     //         id: tasks.id, name: tasks.name, status: tasks.status, createdAt: tasks.createdAt, projectId: tasks.projectId, projectName: projects.name
//     //     }).from(tasks).leftJoin(projects, eq(tasks.projectId, projects.id))
//     //         .where(and(
//     //             eq(tasks.userId, userId),
//     //             eq(tasks.isArchived, false),
//     //             gte(sql`DATE(${tasks.createdAt})`, startDate),
//     //             lte(sql`DATE(${tasks.createdAt})`, endDate),
//     //             sql`(${tasks.projectId} IS NULL OR ${projects.isArchived} = false)`
//     //         )).orderBy(asc(tasks.id)),
//     //     db.select().from(projects).where(and(eq(projects.userId, userId), eq(projects.isArchived, false))).orderBy(asc(projects.name))
//     // ]);

//     // const summaryMap = new Map(summaries.map(s => [s.date, s.manualTotalSeconds]));

//     async function fetchAndGroup(userId: number, startDate: string, endDate: string) {
//         const [logs, summaries, allTasks] = await Promise.all([
//             db.select().from(timeLogs).where(and(eq(timeLogs.userId, userId), gte(timeLogs.date, startDate), lte(timeLogs.date, endDate))).orderBy(desc(timeLogs.startTime)),
//             db.select().from(dailySummaries).where(and(eq(dailySummaries.userId, userId), gte(dailySummaries.date, startDate), lte(dailySummaries.date, endDate))),
//             db.select({
//                 id: tasks.id, name: tasks.name, status: tasks.status, createdAt: tasks.createdAt, projectId: tasks.projectId, projectName: projects.name
//             }).from(tasks).leftJoin(projects, eq(tasks.projectId, projects.id))
//                 .where(and(
//                     eq(tasks.userId, userId),
//                     eq(tasks.isArchived, false),
//                     gte(sql`DATE(${tasks.createdAt})`, startDate),
//                     lte(sql`DATE(${tasks.createdAt})`, endDate),
//                     sql`(${tasks.projectId} IS NULL OR ${projects.isArchived} = false)`
//                 )).orderBy(asc(tasks.id))
//         ]);

//         const summaryMap = new Map(summaries.map(s => [s.date, s.manualTotalSeconds]));
//         const groupedData: Record<string, any> = {};

//         logs.forEach(log => {
//             if (!groupedData[log.date]) {
//                 const manualTotal = summaryMap.get(log.date);
//                 groupedData[log.date] = { date: log.date, totalSeconds: manualTotal ?? 0, isManual: manualTotal !== undefined, calculatedSum: 0, entries: [], dayTasks: [] };
//             }
//             groupedData[log.date].entries.push(log);
//             groupedData[log.date].calculatedSum += (log.duration || 0);
//             if (!groupedData[log.date].isManual) groupedData[log.date].totalSeconds = groupedData[log.date].calculatedSum;
//         });

//         allTasks.forEach(task => {
//             // FIX: Use toLocaleDateString('en-CA') to prevent UTC timezone shift
//             const taskDate = task.createdAt ? new Date(task.createdAt).toLocaleDateString('en-CA') : '';
//             if (taskDate) {
//                 if (!groupedData[taskDate]) {
//                     groupedData[taskDate] = { date: taskDate, totalSeconds: 0, isManual: false, calculatedSum: 0, entries: [], dayTasks: [] };
//                 }
//                 groupedData[taskDate].dayTasks.push(task);
//             }
//         });

//         return Object.values(groupedData).sort((a, b) => b.date.localeCompare(a.date));
//     }

//     // 5. Group logs and tie tasks by date
//     // const groupedData = logs.reduce((acc, log) => {
//     //     if (!acc[log.date]) {
//     //         const manualTotal = summaryMap.get(log.date);
//     //         acc[log.date] = {
//     //             date: log.date,
//     //             totalSeconds: manualTotal ?? 0,
//     //             isManual: manualTotal !== undefined,
//     //             calculatedSum: 0,
//     //             entries: [],
//     //             dayTasks: []
//     //         };
//     //     }
//     //     acc[log.date].entries.push(log);
//     //     acc[log.date].calculatedSum += (log.duration || 0);

//     //     if (!acc[log.date].isManual) {
//     //         acc[log.date].totalSeconds = acc[log.date].calculatedSum;
//     //     }
//     //     return acc;
//     // }, {} as Record<string, any>);

//     // Tie Tasks to Dates based on createdAt
//     // allTasks.forEach(task => {
//     //     const taskDate = task.createdAt ? new Date(task.createdAt).toISOString().split('T')[0] : '';
//     //     if (taskDate) {
//     //         if (!groupedData[taskDate]) {
//     //             groupedData[taskDate] = {
//     //                 date: taskDate,
//     //                 totalSeconds: 0,
//     //                 isManual: false,
//     //                 calculatedSum: 0,
//     //                 entries: [],
//     //                 dayTasks: []
//     //             };
//     //         }
//     //         groupedData[taskDate].dayTasks.push(task);
//     //     }
//     // });

//     // return {
//     //     dailyLogs: Object.values(groupedData).sort((a, b) => b.date.localeCompare(a.date)),
//     //     projects: userProjects,
//     //     filters: { startDate, endDate }
//     // };
// };

// --- NEW HELPER TO FETCH AND GROUP DATA ---
async function fetchAndGroup(userId: number, startDate: string, endDate: string, tz: string) {
    const [logs, summaries, allTasks] = await Promise.all([
        db.select().from(timeLogs).where(and(eq(timeLogs.userId, userId), gte(timeLogs.date, startDate), lte(timeLogs.date, endDate))).orderBy(desc(timeLogs.startTime)),
        db.select().from(dailySummaries).where(and(eq(dailySummaries.userId, userId), gte(dailySummaries.date, startDate), lte(dailySummaries.date, endDate))),
        db.select({
            id: tasks.id, name: tasks.name, status: tasks.status, createdAt: tasks.createdAt, projectId: tasks.projectId, projectName: projects.name
        }).from(tasks).leftJoin(projects, eq(tasks.projectId, projects.id))
            .where(and(
                eq(tasks.userId, userId),
                eq(tasks.isArchived, false),
                // USE THE STORED TIMESTAMP TO DEFINE THE DAY
                gte(sql`DATE(${tasks.createdAt} AT TIME ZONE ${tz})`, startDate),
                lte(sql`DATE(${tasks.createdAt} AT TIME ZONE ${tz})`, endDate),
                sql`(${tasks.projectId} IS NULL OR ${projects.isArchived} = false)`
            )).orderBy(asc(tasks.id))
    ]);

    const groupedData: Record<string, any> = {};
    const summaryMap = new Map(summaries.map(s => [s.date, s.manualTotalSeconds]));

    logs.forEach(log => {
        if (!groupedData[log.date]) {
            const manualTotal = summaryMap.get(log.date);
            groupedData[log.date] = { date: log.date, totalSeconds: manualTotal ?? 0, isManual: manualTotal !== undefined, calculatedSum: 0, entries: [], dayTasks: [] };
        }
        groupedData[log.date].entries.push(log);
        groupedData[log.date].calculatedSum += (log.duration || 0);
        if (!groupedData[log.date].isManual) groupedData[log.date].totalSeconds = groupedData[log.date].calculatedSum;
    });

    allTasks.forEach(task => {
        const taskDate = task.createdAt ? new Date(task.createdAt).toLocaleDateString('en-CA', { timeZone: tz }) : '';
        if (taskDate) {
            if (!groupedData[taskDate]) {
                const manualTotal = summaryMap.get(taskDate);
                groupedData[taskDate] = { date: taskDate, totalSeconds: manualTotal ?? 0, isManual: manualTotal !== undefined, calculatedSum: 0, entries: [], dayTasks: [] };
            }
            groupedData[taskDate].dayTasks.push(task);
        }
    });

    return Object.values(groupedData).sort((a, b) => b.date.localeCompare(a.date));
}

// export const load = async ({ cookies, url }) => {
//     const userId = Number(cookies.get('user_id'));
//     const startParam = url.searchParams.get('start');
//     const endParam = url.searchParams.get('end');

//     const now = new Date();
//     const currentWeekBounds = getWeekBounds(now);
//     // const currentWeek = getWeekBounds(new Date());

//     const archiveStart = startParam || currentWeekBounds.start;
//     const archiveEnd = endParam || currentWeekBounds.end;
//     // const startDate = startParam || currentWeekBounds.start;
//     // const endDate = endParam || currentWeekBounds.end;

//     // Detect if the user is looking at something other than the current week
//     const isFiltered = startParam !== null && (startParam !== currentWeekBounds.start || endParam !== currentWeekBounds.end);

//     const [filterLogs, userProjects, rawCurrentLogs] = await Promise.all([
//         fetchAndGroup(userId, startDate, endDate),
//         db.select().from(projects).where(and(eq(projects.userId, userId), eq(projects.isArchived, false))).orderBy(asc(projects.name)),
//         isFiltered ? fetchAndGroup(userId, currentWeek.start, currentWeek.end) : Promise.resolve(null)
//     ]);

//     // DEDUPLICATION: Remove days from currentWeekLogs if they are already in filterLogs
//     const filterDates = new Set(filterLogs.map(l => l.date));
//     const currentWeekLogs = rawCurrentLogs
//         ? rawCurrentLogs.filter(l => !filterDates.has(l.date))
//         : null;

//     return {
//         dailyLogs: filterLogs,
//         currentWeekLogs,
//         projects: userProjects,
//         isFiltered,
//         filters: { startDate, endDate }
//     };
// };

export const load = async ({ cookies, url }) => {
    const userId = Number(cookies.get('user_id'));
    const userTz = cookies.get('user_timezone') || 'Asia/Jakarta';

    // 1. GLOBAL RECOVERY: Look for any open log regardless of date filter
    const [activeSession] = await db.select()
        .from(timeLogs)
        .where(and(eq(timeLogs.userId, userId), isNull(timeLogs.endTime)))
        .limit(1);

    let activeTimer = null;
    if (activeSession) {
        const startTime = new Date(activeSession.startTime).getTime();
        const now = new Date().getTime();
        activeTimer = {
            date: activeSession.date,
            seconds: Math.floor((now - startTime) / 1000),
            lastSeenAt: activeSession.lastSeenAt
        };
    }

    const startParam = url.searchParams.get('start');
    const endParam = url.searchParams.get('end');

    const localNow = new Date().toLocaleDateString('en-CA', { timeZone: userTz });
    const currentWeek = getWeekBounds(new Date(), userTz);
    const archiveStart = startParam || currentWeek.start;
    const archiveEnd = endParam || currentWeek.end;

    // Fetch Full Week for Header Total
    const headerBounds = getWeekBounds(new Date(archiveStart), userTz);

    const [archiveLogs, userProjects, workspaceLogs, headerLogs] = await Promise.all([
        fetchAndGroup(userId, archiveStart, archiveEnd, userTz),
        db.select().from(projects).where(and(eq(projects.userId, userId), eq(projects.isArchived, false))).orderBy(asc(projects.name)),
        fetchAndGroup(userId, currentWeek.start, currentWeek.end, userTz),
        fetchAndGroup(userId, headerBounds.start, headerBounds.end, userTz)
    ]);

    const totalSeconds = headerLogs.reduce((acc, day) => acc + day.totalSeconds, 0);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);

    // Filter Workspace to remove duplicates from Archive
    const archiveDates = new Set(archiveLogs.map(l => l.date));
    const currentWeekLogs = workspaceLogs.filter(day => !archiveDates.has(day.date));

    return {
        dailyLogs: archiveLogs,
        currentWeekLogs,
        projects: userProjects,
        isFiltered: startParam !== null,
        headerWeekTotal: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
        filters: { startDate: archiveStart, endDate: archiveEnd },
        activeTimer
    };
};

export const actions = {
    // Action to create a task from the header
    createTask: async ({ request, cookies }) => {
        const userId = Number(cookies.get('user_id'));
        const data = await request.formData();
        const name = data.get('name')?.toString();

        if (!name || name.trim() === '') {
            return fail(400, { message: 'Task name is required' });
        }

        await db.insert(tasks).values({
            userId,
            name: name.trim(),
            status: 'Todo',
            createdAt: new Date(),
            isArchived: false
        });

        return { success: true };
    },

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
        const userTz = cookies.get('user_timezone') || 'Asia/Jakarta';
        const data = await request.formData();
        const taskIds = data.get('taskIds')?.toString().split(',').filter(Boolean).map(Number) || [];
        const wipeDates = data.get('wipeDates')?.toString().split(',').filter(Boolean) || [];

        if (wipeDates.length > 0) {
            await db.delete(timeLogs).where(and(eq(timeLogs.userId, userId), inArray(timeLogs.date, wipeDates)));
            await db.delete(dailySummaries).where(and(eq(dailySummaries.userId, userId), inArray(dailySummaries.date, wipeDates)));
        }

        if (taskIds.length > 0) {
            await db.update(timeLogs)
                .set({ taskId: null })
                .where(and(eq(timeLogs.userId, userId), inArray(timeLogs.taskId, taskIds)));

            // 3. NOW SAFE TO DELETE INDIVIDUAL TASKS
            await db.delete(tasks).where(inArray(tasks.id, taskIds));
        }

        if (wipeDates.length > 0) {
            for (const date of wipeDates) {
                await db.delete(tasks).where(and(
                    eq(tasks.userId, userId),
                    sql`DATE(${tasks.createdAt} AT TIME ZONE ${userTz}) = ${date}`
                ));
            }
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