import { db } from '$lib/db';
import { timeLogs, dailySummaries, tasks, projects } from '$lib/db/schema';
import { eq, and, gte, lte, asc, sql } from 'drizzle-orm';

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

export const load = async ({ cookies, url }) => {
    const userId = Number(cookies.get('user_id'));
    const userTz = cookies.get('user_timezone') || 'Asia/Jakarta';

    const startParam = url.searchParams.get('start');
    const endParam = url.searchParams.get('end');

    const currentWeek = getWeekBounds(new Date(), userTz);
    const startDate = startParam || currentWeek.start;
    const endDate = endParam || currentWeek.end;

    // 1. Fetch Logs to calculate Total and Dailies
    const [logs, summaries] = await Promise.all([
        db.select()
            .from(timeLogs)
            .where(and(
                eq(timeLogs.userId, userId),
                gte(timeLogs.date, startDate),
                lte(timeLogs.date, endDate)
            )),
        db.select()
            .from(dailySummaries)
            .where(and(
                eq(dailySummaries.userId, userId),
                gte(dailySummaries.date, startDate),
                lte(dailySummaries.date, endDate)
            ))
    ]);

    const summaryMap = new Map(summaries.map(s => [s.date, s.manualTotalSeconds]));
    const groupedLogs: Record<string, number> = {};

    logs.forEach(log => {
        if (!groupedLogs[log.date]) groupedLogs[log.date] = 0;
        if (log.endTime !== null) {
            groupedLogs[log.date] += (log.duration || 0);
        }
    });

    for (const [date, manualSecs] of summaryMap.entries()) {
        if (manualSecs !== null && manualSecs !== undefined) {
            groupedLogs[date] = manualSecs;
        }
    }

    // 2. Generate chart data array iterating from start to end dates
    const chartData = [];
    let totalSecondsOverall = 0;
    
    // Parse dates into proper objects for iteration
    const [sYr, sMo, sDa] = startDate.split('-').map(Number);
    const [eYr, eMo, eDa] = endDate.split('-').map(Number);
    
    const currentDate = new Date(sYr, sMo - 1, sDa);
    const end = new Date(eYr, eMo - 1, eDa);
    
    let dayCount = 0;
    // Prevent infinite loop from bad params
    let safetyCounter = 0;

    const isLongRange = (end.getTime() - currentDate.getTime()) > (7 * 24 * 60 * 60 * 1000);

    while (currentDate <= end && safetyCounter < 365) {
        const dateStr = currentDate.toLocaleDateString('en-CA');
        const seconds = groupedLogs[dateStr] || 0;
        totalSecondsOverall += seconds;
        
        const dayOfWeekStr = currentDate.toLocaleDateString('en-US', { weekday: 'short' });
        const dateStrShort = `${currentDate.getMonth() + 1}/${currentDate.getDate()}`;
        
        const fullDateOpt: Intl.DateTimeFormatOptions = { weekday: 'short', day: '2-digit', month: 'long' };

        chartData.push({
            day: `${dayOfWeekStr}\n${dateStrShort}`,
            date: currentDate.toLocaleDateString('en-US', fullDateOpt),
            rawDate: dateStr,
            logged: seconds / 3600
        });
        
        currentDate.setDate(currentDate.getDate() + 1);
        dayCount++;
        safetyCounter++;
    }

    // Averages and Totals
    const hT = Math.floor(totalSecondsOverall / 3600);
    const mT = Math.floor((totalSecondsOverall % 3600) / 60);
    let totalLoggedTime = "";
    if (hT > 0) totalLoggedTime += `${hT}h`;
    if (mT > 0) {
        if (totalLoggedTime.length > 0) totalLoggedTime += " ";
        totalLoggedTime += `${mT}m`;
    }
    if (!totalLoggedTime) totalLoggedTime = "0h";

    const avgSeconds = dayCount > 0 ? totalSecondsOverall / dayCount : 0;
    const hA = Math.floor(avgSeconds / 3600);
    const mA = Math.floor((avgSeconds % 3600) / 60);
    let avgDailyHours = "";
    if (hA > 0) avgDailyHours += `${hA}h`;
    if (mA > 0) {
        if (avgDailyHours.length > 0) avgDailyHours += " ";
        avgDailyHours += `${mA}m`;
    }
    if (!avgDailyHours) avgDailyHours = "0h";

    // 3. Breakdown Fetch constraints (Tasks created in range)
    const allTasksRaw = await db.select({
        id: tasks.id, 
        name: tasks.name, 
        status: tasks.status, 
        projectId: tasks.projectId, 
        projectName: projects.name,
        createdAt: tasks.createdAt
    })
    .from(tasks)
    .leftJoin(projects, eq(tasks.projectId, projects.id))
    .where(and(
        eq(tasks.userId, userId),
        eq(tasks.isArchived, false),
        gte(sql`DATE(${tasks.createdAt} AT TIME ZONE ${userTz})`, startDate),
        lte(sql`DATE(${tasks.createdAt} AT TIME ZONE ${userTz})`, endDate),
        sql`(${tasks.projectId} IS NULL OR ${projects.isArchived} = false)`
    )).orderBy(asc(tasks.id));

    const allTasks = allTasksRaw.map(t => {
        const dateStr = t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-CA', { timeZone: userTz }) : '';
        return {
            id: t.id,
            name: t.name,
            status: t.status,
            projectId: t.projectId,
            projectName: t.projectName,
            rawDate: dateStr
        };
    });

    // Calculate Projects breakdown counts
    const userProjects = await db.select().from(projects).where(and(eq(projects.userId, userId), eq(projects.isArchived, false))).orderBy(asc(projects.name));

    const projectBreakdown = userProjects.map(p => ({
        id: p.id,
        name: p.name,
        tasksCount: allTasks.filter(t => t.projectId === p.id).length
    })).filter(p => p.tasksCount > 0);

    const unassignedCount = allTasks.filter(t => t.projectId === null).length;
    if (unassignedCount > 0) {
        projectBreakdown.push({
            id: null as unknown as number,
            name: "Unassigned",
            tasksCount: unassignedCount
        });
    }

    return {
        filters: { startDate, endDate },
        totalLoggedTime,
        avgDailyHours,
        chartData,
        projects: projectBreakdown,
        tasks: allTasks
    };
};
