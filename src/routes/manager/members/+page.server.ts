import { db } from '$lib/db';
import { invitations, users, organizations } from '$lib/db/schema';
import { eq, lt, and, ne } from 'drizzle-orm';
import { fail, redirect } from '@sveltejs/kit';
import { randomUUID } from 'node:crypto';
import { sendInviteEmail } from '$lib/server/emails';

function buildExpiresAt() {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    return expiresAt;
}

export const load = async ({ cookies }) => {
    const userId = cookies.get('user_id');
    if (!userId) throw redirect(303, '/login');

    const [manager] = await db.select().from(users).where(eq(users.id, Number(userId)));
    if (!manager || manager.role !== 'Manager') throw redirect(303, '/dashboard');

    await db
        .update(invitations)
        .set({ status: 'Expired' })
        .where(
            and(
                eq(invitations.organizationId, manager.organizationId),
                eq(invitations.status, 'Sent'),
                lt(invitations.expiresAt, new Date())
            )
        );

    const allInvitations = await db
        .select()
        .from(invitations)
        .where(eq(invitations.organizationId, manager.organizationId));

    const activeMembers = await db
        .select()
        .from(users)
        .where(
            and(
                eq(users.organizationId, manager.organizationId),
                ne(users.id, Number(userId))
            )
        );

    return {
        members: activeMembers,
        invitations: allInvitations
    };
};

export const actions = {
    invite: async ({ request, cookies }) => {
        try {
            const userId = cookies.get('user_id');
            const data = await request.formData();
            const email = data.get('email') as string;

            if (!email) return fail(400, { message: 'Email is required.' });

            const [manager] = await db.select().from(users).where(eq(users.id, Number(userId)));
            if (!manager) return fail(401, { message: 'Unauthorized' });

            // 1. Check if they are already a registered member
            const [existingUser] = await db.select().from(users).where(eq(users.email, email));
            if (existingUser) {
                return fail(400, { message: 'This email is already registered as a member of your organization.' });
            }

            // 2. Check if an invitation is already active (Sent)
            const [existingInvite] = await db
                .select()
                .from(invitations)
                .where(
                    and(
                        eq(invitations.email, email),
                        eq(invitations.organizationId, manager.organizationId),
                        eq(invitations.status, 'Sent')
                    )
                );

            if (existingInvite) {
                return fail(400, { message: 'An active invitation has already been sent to this email.' });
            }

            // 3. Check for Revoked/Expired invites - we allow re-inviting them by just notifying 
            // but actually we'll just allow creating a new one if it's not active.
            // (Note: To be super clean, we could update the old one, but a new row is fine for history)
            
            const token = randomUUID();
            const expiresAt = buildExpiresAt();

            // 1. Save to Database
            await db.insert(invitations).values({
                token,
                email,
                organizationId: manager.organizationId,
                status: 'Sent',
                expiresAt
            });

            // 2. Fetch Organization Name for the Email
            const [org] = await db
                .select()
                .from(organizations)
                .where(eq(organizations.id, manager.organizationId as number));

            // 3. Send Real Email via Resend
            const emailResult = await sendInviteEmail(email, org?.name || "Pilarr Organization", token);

            if (emailResult.simulated) {
                return { 
                    success: true, 
                    message: "Invitation saved! Since Resend is in Test Mode, check your terminal for the registration link." 
                };
            }

            return { success: true };
        } catch (e: any) {
            console.error('Invite Error:', e);
            return fail(500, { message: e.message || 'Failed to send invitation. Please check database connection.' });
        }
    },

    reinvite: async ({ request, cookies }) => {
        try {
            const userId = cookies.get('user_id');
            const data = await request.formData();
            const oldToken = data.get('token') as string;

            const [manager] = await db.select().from(users).where(eq(users.id, Number(userId)));

            const [existing] = await db
                .select()
                .from(invitations)
                .where(
                    and(
                        eq(invitations.token, oldToken),
                        eq(invitations.organizationId, manager.organizationId)
                    )
                );

            if (!existing || existing.status === 'Sent' || existing.status === 'Joined') {
                return fail(400, { message: 'This invitation cannot be re-sent.' });
            }

            const newToken = randomUUID();
            const expiresAt = buildExpiresAt();

            await db
                .update(invitations)
                .set({ token: newToken, status: 'Sent', expiresAt })
                .where(eq(invitations.token, oldToken));

            const [org] = await db.select().from(organizations).where(eq(organizations.id, manager.organizationId as number));
            const emailResult = await sendInviteEmail(existing.email, org?.name || "Pilarr Organization", newToken);

            if (emailResult.simulated) {
                return { 
                    success: true, 
                    message: "Invitation re-sent! Check your terminal for the link (Resend Test Mode active)." 
                };
            }

            return { success: true };
        } catch (e: any) {
            return fail(500, { message: 'Failed to re-invite.' });
        }
    },

    revoke: async ({ request, cookies }) => {
        try {
            const userId = cookies.get('user_id');
            const data = await request.formData();
            const token = data.get('token') as string;

            const [manager] = await db.select().from(users).where(eq(users.id, Number(userId)));

            const [existing] = await db
                .select()
                .from(invitations)
                .where(
                    and(
                        eq(invitations.token, token),
                        eq(invitations.organizationId, manager.organizationId),
                        eq(invitations.status, 'Sent')
                    )
                );

            if (!existing) return fail(400, { message: 'Invitation not found.' });

            await db
                .update(invitations)
                .set({ status: 'Revoked' })
                .where(eq(invitations.token, token));

            return { success: true };
        } catch (e: any) {
            return fail(500, { message: 'Failed to revoke invitation.' });
        }
    },

    // Hard Delete for dead invitations (Expired/Revoked)
    deleteInvite: async ({ request, cookies }) => {
        try {
            const userId = cookies.get('user_id');
            const data = await request.formData();
            const token = data.get('token') as string;

            const [manager] = await db.select().from(users).where(eq(users.id, Number(userId)));

            await db
                .delete(invitations)
                .where(
                    and(
                        eq(invitations.token, token),
                        eq(invitations.organizationId, manager.organizationId)
                    )
                );

            return { success: true };
        } catch (e: any) {
            return fail(500, { message: 'Failed to delete invitation.' });
        }
    },

    // Toggle Member Status (Active <-> Inactive)
    toggleStatus: async ({ request, cookies }) => {
        try {
            const userIdCookie = cookies.get('user_id');
            const data = await request.formData();
            const targetUserId = Number(data.get('userId'));

            const [manager] = await db.select().from(users).where(eq(users.id, Number(userIdCookie)));

            // Security: Ensure target user belongs to the same org
            const [targetUser] = await db
                .select()
                .from(users)
                .where(
                    and(
                        eq(users.id, targetUserId),
                        eq(users.organizationId, manager.organizationId)
                    )
                );

            if (!targetUser) return fail(404, { message: 'User not found.' });
            if (targetUser.role === 'Manager') return fail(403, { message: 'Cannot deactivate a manager account.' });

            const newStatus = targetUser.status === 'Active' ? 'Inactive' : 'Active';

            await db
                .update(users)
                .set({ status: newStatus })
                .where(eq(users.id, targetUserId));

            return { success: true };
        } catch (e: any) {
            return fail(500, { message: 'Failed to toggle status.' });
        }
    }
};