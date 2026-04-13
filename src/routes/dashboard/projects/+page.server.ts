// src/routes/dashboard/projects/+page.server.ts
import { db } from '$lib/db';
import { projects, tasks } from '$lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';

export const load = async ({ cookies }) => {
    const userId = Number(cookies.get('user_id'));

    // Fetch projects along with task counts for the health bar
    const userProjects = await db.select({
        id: projects.id,
        name: projects.name,
        isArchived: projects.isArchived,
        totalTasks: sql<number>`count(${tasks.id})`.mapWith(Number),
        remainingTasks: sql<number>`count(${tasks.id}) filter (where ${tasks.completed} = false)`.mapWith(Number)
    })
        .from(projects)
        .leftJoin(tasks, eq(projects.id, tasks.projectId))
        .where(eq(projects.userId, userId))
        .groupBy(projects.id);

    return { projects: userProjects };
};

export const actions = {
    createProject: async ({ request, cookies }) => {
        const userId = Number(cookies.get('user_id'));
        const data = await request.formData();
        const name = data.get('name')?.toString();
        if (!name) return fail(400, { message: 'Name required' });

        await db.insert(projects).values({ name, userId });
        return { success: true };
    },

    archiveProject: async ({ request }) => {
        const data = await request.formData();
        const id = Number(data.get('id'));
        const archive = data.get('archive') === 'true';

        // Cascade: Archive project AND all its tasks
        await db.transaction(async (tx) => {
            await tx.update(projects).set({ isArchived: archive }).where(eq(projects.id, id));
            await tx.update(tasks).set({ isArchived: archive }).where(eq(tasks.projectId, id));
        });

        return { success: true };
    },

    deleteProject: async ({ request }) => {
        const data = await request.formData();
        const id = Number(data.get('id'));

        // Cascade: Delete project AND all its tasks
        await db.transaction(async (tx) => {
            await tx.delete(tasks).where(eq(tasks.projectId, id));
            await tx.delete(projects).where(eq(projects.id, id));
        });

        return { success: true };
    }
};