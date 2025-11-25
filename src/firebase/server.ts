
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

/**
 * Creates and configures an OAuth2 client for Google APIs.
 * This function is intended to be used only on the server-side.
 * It reads credentials from environment variables.
 *
 * @param {string} redirectUri - The dynamically determined redirect URI.
 * @returns {import('google-auth-library').OAuth2Client} An OAuth2 client instance.
 */
export function getOAuth2Client(redirectUri: string): OAuth2Client {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        throw new Error("Google OAuth credentials (CLIENT_ID, CLIENT_SECRET) are not set in environment variables.");
    }
    
    const client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        redirectUri // Use the dynamically provided redirect URI
    );

    return client;
}
