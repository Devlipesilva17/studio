
import { google } from 'googleapis';

/**
 * Creates and configures an OAuth2 client for Google APIs.
 * This function is intended to be used only on the server-side.
 * It reads credentials from environment variables.
 *
 * @returns {import('google-auth-library').OAuth2Client} An OAuth2 client instance.
 */
export function getOAuth2Client() {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REDIRECT_URI) {
        throw new Error("Google OAuth credentials are not set in environment variables.");
    }
    return new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
    );
}

    