import { db } from '$lib/db';
import { users } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import { fail, redirect } from '@sveltejs/kit';

export const actions = {
    default: async ({ request, cookies }) => {
        const data = await request.formData();
        const email = data.get('email') as string;
        const password = data.get('password') as string;

        // 1. Fetch user from Postgres
        const [user] = await db.select().from(users).where(eq(users.email, email));

        // 2. Validation
        if (!user || user.password !== password) {
            return fail(400, {
                error: 'Invalid credentials. Please check your email and password.'
            });
        }

        // 3. Set the Session Cookie
        cookies.set('user_id', user.id.toString(), {
            path: '/',
            httpOnly: true,
            sameSite: 'strict',
            maxAge: 60 * 60 * 24 * 7 // 1 week
        });

        // 4. Role-Based Redirection (The Strategy Layer)
        if (user.role === 'Manager') {
            // Send Managers to their Suite
            throw redirect(303, '/manager/members');
        } else {
            // Send Employees to the simple profile/tracker
            throw redirect(303, '/dashboard');
        }
        // if (user.role === 'Manager') {
        //     throw redirect(303, '/manager/dashboard');
        // } else {
        //     throw redirect(303, '/dashboard');
        // }
        // throw redirect(303, '/dashboard');
    }
};