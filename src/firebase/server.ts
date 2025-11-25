
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { firebaseConfig } from './config';

/**
 * Creates and configures an OAuth2 client for Google APIs.
 * This function is intended to be used only on the server-side.
 * It reads credentials from environment variables and constructs a
 * stable redirect URI based on the Firebase project's authDomain.
 *
 * @returns {import('google-auth-library').OAuth2Client} An OAuth2 client instance.
 */
export function getOAuth2Client(): OAuth2Client {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        throw new Error("Google OAuth credentials (CLIENT_ID, CLIENT_SECRET) are not set in environment variables.");
    }
    
    // Use the project's stable authDomain to construct the redirect URI.
    // This avoids issues with dynamic or proxy-based host headers.
    const authDomain = new URL(`https://${firebaseConfig.authDomain}`);
    const redirectURI = `${authDomain.origin}/api/auth/google/callback`;

    const client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        redirectURI
    );

    return client;
}
