import { redirect } from '@sveltejs/kit';
import { db } from '$lib/db';
import { users, organizations, timeLogs } from '$lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';

export const load = async ({ cookies }) => {
    const userId = cookies.get('user_id');
    if (!userId) throw redirect(303, '/login');

    // Join user with organization for the sidebar switcher
    const [userData] = await db.select({
        name: users.name,
        email: users.email,
        role: users.role,
        organizationName: organizations.name,
        organizationId: organizations.id
    })
        .from(users)
        .innerJoin(organizations, eq(users.organizationId, organizations.id))
        .where(eq(users.id, Number(userId)));

    if (!userData) {
        cookies.delete('user_id', { path: '/' });
        throw redirect(303, '/login');
    }

    // Global active timer session query
    const [activeSession] = await db.select()
        .from(timeLogs)
        .where(and(eq(timeLogs.userId, Number(userId)), isNull(timeLogs.endTime)))
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

    return { user: userData, activeTimer };
};
