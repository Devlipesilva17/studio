
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { NextRequest } from 'next/server';

/**
 * Creates and configures an OAuth2 client for Google APIs.
 * This function is intended to be used only on the server-side.
 * It reads credentials from environment variables and determines a stable redirect URI.
 *
 * @param {NextRequest} req - The incoming Next.js request object.
 * @returns {import('google-auth-library').OAuth2Client} An OAuth2 client instance.
 */
export function getOAuth2Client(req: NextRequest): OAuth2Client {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        throw new Error("Google OAuth credentials (CLIENT_ID, CLIENT_SECRET) are not set in environment variables.");
    }
    
    // Determine a stable redirect URI.
    // In a Cloud Workstation, the x-forwarded-proto and x-forwarded-host headers
    // provide the original protocol and host.
    const protocol = req.headers.get('x-forwarded-proto') || (process.env.NODE_ENV === 'production' ? 'https' : 'http');
    const host = req.headers.get('x-forwarded-host') || req.headers.get('host');

    if (!host) {
        throw new Error("Could not determine the host for the redirect URI.");
    }
    
    const redirectUri = `${protocol}://${host}/api/auth/google/callback`;

    const client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        redirectUri
    );

    return client;
}
