import { redirect } from '@sveltejs/kit';
import { db } from '$lib/db';
import { users, organizations } from '$lib/db/schema';
import { eq } from 'drizzle-orm';

export const load = async ({ cookies }) => {
    const userId = cookies.get('user_id');
    if (!userId) throw redirect(303, '/login');

    // Join the User with their Organization
    const [userData] = await db.select({
        name: users.name,
        role: users.role,
        organizationName: organizations.name
    })
        .from(users)
        .innerJoin(organizations, eq(users.organizationId, organizations.id))
        .where(eq(users.id, Number(userId)));

    if (!userData || userData.role !== 'Manager') {
        throw redirect(303, '/dashboard');
    }

    return { user: userData };
};