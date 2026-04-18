import { db } from '$lib/db';
import { users, organizations, invitations } from '$lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { fail, redirect } from '@sveltejs/kit';

export const load = async ({ url }) => {
    const token = url.searchParams.get('token');

    // 1. If there's a token, find the specific invitation
    if (token) {
        const [invitation] = await db.select({
            token: invitations.token,
            email: invitations.email,
            organizationId: invitations.organizationId,
            status: invitations.status,
            organizationName: organizations.name,
            expiresAt: invitations.expiresAt
        })
            .from(invitations)
            .innerJoin(organizations, eq(invitations.organizationId, organizations.id))
            .where(eq(invitations.token, token));

        // Security Check: token must exist AND still be in 'Sent' status
        // Expired and Revoked tokens are rejected. Records are deleted after registration so missing = already used.
        if (!invitation || invitation.status !== 'Sent' || new Date() > invitation.expiresAt) {
            return { error: "This invitation link is invalid, expired, or has already been used." };
        }

        return { invitation };
    }

    // 2. If NO token, fetch all organizations (Standard Sign-up)
    const allOrgs = await db.select().from(organizations);
    return { organizations: allOrgs };
};

export const actions = {
    default: async ({ request, cookies }) => {
        const data = await request.formData();
        const name = data.get('name') as string;
        const email = data.get('email') as string;
        const password = data.get('password') as string;
        const organizationId = Number(data.get('organizationId'));
        const token = data.get('token') as string;

        // Save User to Postgres
        const [newUser] = await db.insert(users).values({
            name,
            email,
            password,
            organizationId,
            role: 'Employee',
            status: 'Active'
        }).returning({ id: users.id });

        // Delete the invitation record — the user is now in the users table.
        // Non-existence is the new invalidation mechanism (simpler and cleaner).
        if (token) {
            await db
                .delete(invitations)
                .where(eq(invitations.token, token));
        }

        // Auto-login: Set the session cookie immediately
        cookies.set('user_id', newUser.id.toString(), {
            path: '/',
            httpOnly: true,
            sameSite: 'strict',
            maxAge: 60 * 60 * 24 * 7
        });

        throw redirect(303, '/dashboard');
    }
};