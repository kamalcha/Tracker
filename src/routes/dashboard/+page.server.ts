import { redirect } from '@sveltejs/kit';

export const load = async () => {
    // Since +layout.server.ts already verified the user, 
    // we just send them to their default landing page.
    throw redirect(303, '/dashboard/reports');
};

export const actions = {
    logout: async ({ cookies }) => {
        // Clear the session and redirect 
        cookies.delete('user_id', { path: '/' });
        throw redirect(303, '/login');
    }
};