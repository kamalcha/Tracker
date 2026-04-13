import { db } from '$lib/db';
import { tasks, projects } from '$lib/db/schema';
import { eq, and, asc, inArray } from 'drizzle-orm';
import { redirect, fail } from '@sveltejs/kit';

export const load = async ({ params, cookies }) => {
    const userId = Number(cookies.get('user_id'));
    const projectId = Number(params.id);

    const [project] = await db.select().from(projects)
        .where(and(eq(projects.id, projectId), eq(projects.userId, userId)));

    if (!project) throw redirect(302, '/dashboard/projects');

    const projectTasks = await db.select().from(tasks)
        .where(and(
            eq(tasks.projectId, projectId),
            eq(tasks.isArchived, project.isArchived)
        ))
        .orderBy(asc(tasks.completed), asc(tasks.id));

    const userProjects = await db.select().from(projects).where(eq(projects.userId, userId));

    return {
        project,
        tasks: projectTasks,
        projects: userProjects
    };
};

export const actions = {
    renameProject: async ({ request, params }) => {
        const data = await request.formData();
        const name = data.get('name')?.toString();
        if (!name) return fail(400);
        await db.update(projects).set({ name }).where(eq(projects.id, Number(params.id)));
        return { success: true };
    },

    createTask: async ({ request, cookies, params }) => {
        const userId = Number(cookies.get('user_id'));
        const data = await request.formData();
        const name = data.get('name')?.toString();
        if (!name) return fail(400);

        await db.insert(tasks).values({
            name,
            userId,
            projectId: Number(params.id),
            status: 'Todo'
        });
        return { success: true };
    },

    updateTask: async ({ request }) => {
        const data = await request.formData();
        const id = Number(data.get('id'));
        const updateFields: any = {};

        // Added name support for inline editing
        if (data.has('name')) {
            updateFields.name = data.get('name')?.toString();
        }

        if (data.has('status')) {
            const status = data.get('status')?.toString();
            updateFields.status = status;
            updateFields.completed = status === 'Done';
        }

        if (Object.keys(updateFields).length > 0) {
            await db.update(tasks).set(updateFields).where(eq(tasks.id, id));
        }

        return { success: true };
    },

    archiveTasks: async ({ request }) => {
        const data = await request.formData();
        const ids = JSON.parse(data.get('ids') as string).map(Number);
        const archive = data.get('archive') === 'true';

        await db.update(tasks)
            .set({ isArchived: archive })
            .where(inArray(tasks.id, ids));

        return { success: true };
    },

    deleteTasks: async ({ request }) => {
        const data = await request.formData();
        const ids = JSON.parse(data.get('ids') as string).map(Number);
        await db.delete(tasks).where(inArray(tasks.id, ids));
        return { success: true };
    }
};