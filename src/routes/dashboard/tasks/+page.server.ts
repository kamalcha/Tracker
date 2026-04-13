// src/routes/dashboard/tasks/+page.server.ts
import { db } from '$lib/db';
import { tasks, projects } from '$lib/db/schema';
import { eq, and, asc, desc, sql, inArray } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';

export const load = async ({ cookies }) => {
    const userId = Number(cookies.get('user_id'));

    const allTasks = await db.select()
        .from(tasks)
        .where(eq(tasks.userId, userId))
        // Stable sort: completed tasks at bottom, otherwise sorted by ID
        .orderBy(asc(tasks.completed), asc(tasks.id));

    const userProjects = await db.select()
        .from(projects)
        .where(eq(projects.userId, userId));

    return {
        tasks: allTasks,
        projects: userProjects
    };
};

export const actions = {
    createTask: async ({ request, cookies }) => {
        const userId = Number(cookies.get('user_id'));
        const data = await request.formData();
        const name = data.get('name')?.toString();
        const projectId = data.get('projectId') ? Number(data.get('projectId')) : null;

        if (!name) return fail(400, { message: 'Name is required' });

        await db.insert(tasks).values({
            name,
            userId,
            projectId,
            status: 'Todo'
        });

        return { success: true };
    },

    updateTask: async ({ request }) => {
        const data = await request.formData();
        const id = Number(data.get('id'));

        // Use a partial object to only update what was sent in the form
        const updateFields: any = {};

        if (data.has('status')) {
            const status = data.get('status')?.toString();
            updateFields.status = status;
            updateFields.completed = status === 'Done';
        }

        if (data.has('projectId')) {
            const val = data.get('projectId');
            // Empty string from form hidden input means "None" (null in DB)
            updateFields.projectId = (val === "" || val === null) ? null : Number(val);
        }

        if (Object.keys(updateFields).length > 0) {
            await db.update(tasks).set(updateFields).where(eq(tasks.id, id));
        }

        return { success: true };
    },

    createAndAssignProject: async ({ request, cookies }) => {
        const userId = Number(cookies.get('user_id'));
        const data = await request.formData();
        const name = data.get('name')?.toString();
        const taskId = data.get('taskId') ? Number(data.get('taskId')) : null;

        if (!name) return fail(400, { message: 'Project name required' });

        // 1. Create the new project
        const [newProject] = await db.insert(projects).values({ name, userId }).returning();

        // 2. Instantly assign it to the task
        if (taskId && newProject) {
            await db.update(tasks).set({ projectId: newProject.id }).where(eq(tasks.id, taskId));
        }

        return { success: true };
    },

    archiveTasks: async ({ request }) => {
        const data = await request.formData();
        // Convert the string array from JSON.parse into a number array
        const ids = JSON.parse(data.get('ids') as string).map(Number);
        const archive = data.get('archive') === 'true';

        if (ids.length === 0) return { success: true };

        await db.update(tasks)
            .set({ isArchived: archive })
            .where(inArray(tasks.id, ids)); // cleaner than raw sql

        return { success: true };
    },

    deleteTasks: async ({ request }) => {
        const data = await request.formData();
        const ids = JSON.parse(data.get('ids') as string).map(Number);

        if (ids.length === 0) return { success: true };

        await db.delete(tasks).where(inArray(tasks.id, ids));

        return { success: true };
    },

    toggleComplete: async ({ request }) => {
        const data = await request.formData();
        const id = Number(data.get('id'));
        const completed = data.get('completed') === 'true';

        await db.update(tasks)
            .set({
                completed,
                status: completed ? 'Done' : 'Todo'
            })
            .where(eq(tasks.id, id));

        return { success: true };
    },

    createProject: async ({ request, cookies }) => {
        const userId = Number(cookies.get('user_id'));
        const data = await request.formData();
        const name = data.get('name')?.toString();
        if (!name) return;
        const [newProject] = await db.insert(projects).values({ name, userId }).returning();
        return { project: newProject };
    },
};