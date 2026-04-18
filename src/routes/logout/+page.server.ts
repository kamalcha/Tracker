import { redirect } from '@sveltejs/kit';

export const actions = {
    default: async ({ cookies }) => {
        // Clear the session cookie and redirect to login
        cookies.delete('user_id', { path: '/' });
        throw redirect(303, '/login');
    }
};
