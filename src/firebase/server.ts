
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

/**
 * Creates and configures an OAuth2 client for Google APIs.
 * This function is intended to be used only on the server-side.
 * It reads credentials from environment variables and constructs the
 * redirect URI dynamically based on the request headers.
 *
 * @param {string} host - The hostname from the incoming request (e.g., 'localhost:3000' or 'your-app.com').
 * @returns {import('google-auth-library').OAuth2Client} An OAuth2 client instance.
 */
export function getOAuth2Client(host: string): OAuth2Client {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        throw new Error("Google OAuth credentials (CLIENT_ID, CLIENT_SECRET) are not set in environment variables.");
    }
    
    // Determine the protocol based on the environment.
    // In production/cloud environments, it's typically https.
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const redirectURI = `${protocol}://${host}/api/auth/google/callback`;

    const client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        redirectURI
    );

    return client;
}
