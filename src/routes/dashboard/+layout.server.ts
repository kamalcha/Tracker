import { redirect } from '@sveltejs/kit';
import { db } from '$lib/db';
import { users, organizations } from '$lib/db/schema';
import { eq } from 'drizzle-orm';

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

    return { user: userData };
};
