
import { NextRequest } from 'next/server';
import { getOAuth2Client } from '@/firebase/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, App } from 'firebase-admin/app';

// Initialize Firebase Admin SDK if not already initialized
function getFirebaseAdminApp(): App {
  if (getApps().length) {
    return getApps()[0];
  }
  return initializeApp();
}

/**
 * This is the callback route that Google redirects to after user consent.
 * It exchanges the authorization code for tokens and saves them.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // The user's UID
  const error = searchParams.get('error');

  const closePopupScript = (data: { type: string; [key: string]: any }) => `
    <script>
      window.opener.postMessage(${JSON.stringify(data)}, "${new URL(req.url).origin}");
      window.close();
    </script>
  `;

  if (error) {
    return new Response(
      closePopupScript({ type: 'google-auth-error', message: `O acesso foi negado: ${error}` }),
      { headers: { 'Content-Type': 'text/html' } }
    );
  }

  if (!code || !state) {
    return new Response(
      closePopupScript({ type: 'google-auth-error', message: 'Parâmetros de callback inválidos.' }),
      { headers: { 'Content-Type': 'text/html' } }
    );
  }

  try {
    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.refresh_token) {
        // This can happen if the user has already granted consent before
        // and a refresh token was not requested or returned.
        // We will just update the access token.
    }

    const app = getFirebaseAdminApp();
    const db = getFirestore(app);
    const userRef = db.collection('users').doc(state);
    
    // Securely save the tokens to the user's document in Firestore
    await userRef.set({
      googleAccessToken: tokens.access_token,
      googleRefreshToken: tokens.refresh_token || null, // Can be null on subsequent authorizations
      googleTokenExpiry: tokens.expiry_date,
    }, { merge: true });

    // Return a success message and close the popup
    return new Response(
      closePopupScript({ type: 'google-auth-success' }),
      { headers: { 'Content-Type': 'text/html' } }
    );

  } catch (e: any) {
    console.error("An error occurred during Google OAuth callback:", e);
    return new Response(
      closePopupScript({ type: 'google-auth-error', message: e.message || 'Falha ao obter tokens.' }),
      { headers: { 'Content-Type': 'text/html' } }
    );
  }
}

    