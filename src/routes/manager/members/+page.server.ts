import { db } from '$lib/db';
import { invitations, users } from '$lib/db/schema';
import { eq, lt } from 'drizzle-orm';
import { fail, redirect } from '@sveltejs/kit';
import { randomUUID } from 'node:crypto';

export const load = async ({ cookies }) => {
    const userId = cookies.get('user_id');
    if (!userId) throw redirect(303, '/login');

    const [manager] = await db.select().from(users).where(eq(users.id, Number(userId)));
    if (!manager || manager.role !== 'Manager') throw redirect(303, '/dashboard');

    // 1. CLEANUP: Delete invitations older than 24 hours
    const now = new Date();
    await db.delete(invitations).where(lt(invitations.expiresAt, now));

    // 2. FETCH: Active Members
    const activeMembers = await db.select()
        .from(users)
        .where(eq(users.organizationId, manager.organizationId));

    // 3. FETCH: Pending Invitations
    const pendingInvites = await db.select()
        .from(invitations)
        .where(eq(invitations.organizationId, manager.organizationId));

    return {
        members: activeMembers,
        pending: pendingInvites
    };
};

export const actions = {
    invite: async ({ request, cookies }) => {
        const userId = cookies.get('user_id');
        const data = await request.formData();
        const email = data.get('email') as string;

        const [manager] = await db.select().from(users).where(eq(users.id, Number(userId)));

        // 24-HOUR EXPIRATION: Set for exactly 24 hours from now
        const token = randomUUID();
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        await db.insert(invitations).values({
            token,
            email,
            organizationId: manager.organizationId,
            expiresAt
        });

        // Log link for testing
        console.log(`--- INVITE SENT: http://localhost:5173/register?token=${token} ---`);

        return { success: true };
    }
};