import { Resend } from 'resend';
import { RESEND_API_KEY, APP_URL, EMAIL_FROM } from '$env/static/private';

const resend = new Resend(RESEND_API_KEY);

export async function sendInviteEmail(to: string, orgName: string, token: string) {
	const inviteLink = `${APP_URL}/register?token=${token}`;
    const fromAddress = EMAIL_FROM || 'Pilarr Team <onboarding@resend.dev>';

	try {
		const { data, error } = await resend.emails.send({
			from: fromAddress,
			to,
			subject: `Invitation to join ${orgName} on Pilarr`,
			html: `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1a1a1a; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
                .header { margin-bottom: 32px; text-align: center; }
                .logo { font-size: 24px; font-weight: 900; letter-spacing: -1px; color: #000; }
                .content { background: #ffffff; border-radius: 16px; padding: 32px; border: 1px solid #eaeaea; }
                h1 { size: 20px; font-weight: 800; margin-top: 0; color: #000; }
                p { color: #666; font-size: 16px; }
                .button-container { margin: 32px 0; text-align: center; }
                .button { background-color: #000; color: #fff; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 14px; display: inline-block; }
                .footer { margin-top: 32px; text-align: center; font-size: 12px; color: #999; }
                .expiry { color: #f43f5e; font-weight: 700; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">PILARR</div>
                </div>
                <div class="content">
                    <h1>You've been invited!</h1>
                    <p>Hello,</p>
                    <p>You have been invited to join <strong>${orgName}</strong> on Pilarr, a premium time tracking and team management platform.</p>
                    
                    <div class="button-container">
                        <a href="${inviteLink}" class="button">Join Organization</a>
                    </div>
                    
                    <p>This link will automatically <span class="expiry">expire in 24 hours</span>. If you were not expecting this invitation, you can safely ignore this email.</p>
                </div>
                <div class="footer">
                    &copy; ${new Date().getFullYear()} Pilarr Team. All rights reserved.
                </div>
            </div>
        </body>
        </html>
        `
		});

		if (error) {
			// Specific handling for Resend Onboarding restrictions
			if (error.name === 'validation_error' && error.message.includes('testing emails')) {
				console.log(`\n--- RESEND TEST MODE ACTIVE ---`);
				console.log(`Invite saved, but email to ${to} was blocked by Resend restrictions.`);
				console.log(`LINK: ${inviteLink}\n`);
				return { simulated: true, link: inviteLink };
			}
			throw new Error(error.message);
		}

		console.log('--- EMAIL SENT SUCCESSFULLY ---', data);
		return { success: true, data };
	} catch (err: any) {
		console.error('--- EMAIL ENGINE CRITICAL ERROR ---', err);
		throw err;
	}
}
